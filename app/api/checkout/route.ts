import { NextResponse } from 'next/server';
import { CheckoutSchema } from '@/lib/validations/schemas';
import { rateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { Prisma } from '@prisma/client';
import { createCashfreeOrder, generatePublicOrderId, getCashfreeEnvironment } from '@/lib/cashfree';
import { uploadBufferToR2, getR2PublicUrl } from '@/lib/r2';
import { getLayoutById, FREGORO_LAYOUTS } from '@/lib/wall-studio/layouts-data';
import { calculateWallPrice } from '@/lib/wall-studio/pricing';
import {
  getArtworkCharge,
  getGarmentSizePrice,
  normalizeGarmentId,
  GARMENT_PRICING,
  PLAIN_PRODUCT_TO_GARMENT,
} from '@/lib/config/garment-pricing';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Get the site URL for Cashfree return_url dynamically from the request or env */
function getSiteUrl(req?: Request): string {
  if (req) {
    const origin = req.headers.get('origin');
    if (origin) return origin.replace(/\/$/, '');
    const host = req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    if (host) return `${proto}://${host}`.replace(/\/$/, '');
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await rateLimit(`checkout:${ip}`, 10, 60 * 1000);

    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, message: 'Too many checkout requests. Please try again in a minute.' },
        { status: 429 },
      );
    }

    // 2. Parse & Validate Payload
    const body = await request.json();
    const validation = CheckoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid checkout payload',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { items, address, paymentMethod, couponCode } = validation.data;

    // Cash on Delivery has been removed — only online payment is supported.
    if (paymentMethod !== 'cashfree') {
      return NextResponse.json(
        {
          success: false,
          message: 'Only online payment is available. Please complete the payment via UPI, card, netbanking or wallet.',
        },
        { status: 400 },
      );
    }

    // 3. Get Authenticated User or Fallback to Guest Checkout
    let userId: string | null = null;
    let userEmail: string | undefined;
    let userName: string | undefined;

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userEmail = user.email || `${user.id}@guest.local`;
        userName =
          user.user_metadata?.name || user.user_metadata?.full_name || userEmail.split('@')[0];

        const dbUser = await prisma.user.upsert({
          where: { id: user.id },
          update: {
            email: userEmail,
            fullName: userName || null,
          },
          create: {
            id: user.id,
            email: userEmail,
            fullName: userName || null,
          },
        });
        userId = dbUser.id;
      }
    } catch (authErr) {
      console.warn('Auth user sync notice:', authErr);
    }

    // Support guest checkout if user is not authenticated
    if (!userId && address.email) {
      try {
        const guestEmail = address.email.trim().toLowerCase();
        const guestName = address.name?.trim() || 'Guest';

        const existingUser = await prisma.user.findUnique({
          where: { email: guestEmail },
        });

        if (existingUser) {
          userId = existingUser.id;
        } else {
          const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const dbUser = await prisma.user.create({
            data: {
              id: guestId,
              email: guestEmail,
              fullName: guestName,
              phone: address.phone || null,
            },
          });
          userId = dbUser.id;
        }
      } catch (guestErr) {
        console.warn('Guest user creation notice (proceeding as unlinked order):', guestErr);
        // userId remains null, perfectly supported by Prisma Order model
      }
    }

    // 4. ──── SECURITY FIX: Server-side price recalculation ────
    // NEVER trust client-sent prices. Fetch real prices from DB.
    const designIds = items
      .map((i) => {
        const c = i.customization as Record<string, unknown> | null | undefined;
        return typeof c?.designId === 'string' ? c.designId : null;
      })
      .filter((id): id is string => Boolean(id));

    const productIds = Array.from(new Set([...items.map((i) => i.productId), ...designIds]));
    const variantIds = Array.from(
      new Set(items.map((i) => i.variantId).filter((v) => v && v !== 'default')),
    );

    // Pre-collect all wall layout slugs/ids so we can batch-fetch them in one query
    // instead of doing a separate DB round-trip per wall item in the loop (N+1 fix).
    const wallLayoutKeys = Array.from(
      new Set(
        items
          .filter((i) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const c = i.customization as any;
            return c?.isWallProduct || i.productId.startsWith('wall_') || i.productId.startsWith('prebuilt_');
          })
          .flatMap((i) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const c = i.customization as any;
            const slug = c?.layoutSlug || c?.layoutId;
            return slug ? [slug] : [];
          }),
      ),
    );

    let dbProducts: {
      id: string;
      slug: string;
      name: string;
      basePrice: number;
      customizable: boolean;
    }[] = [];
    let dbVariants: { id: string; productId: string; price: number; inStock: boolean; stockQuantity: number; name: string }[] = [];
    let dbWallLayouts: { id: string; slug: string; basePrice: number; compareAtPrice: number | null }[] = [];
    let dbGarmentProducts: { id: string; basePrice: number; sizePrices: unknown }[] = [];

    const fetchCatalogData = async () => {
      return await Promise.all([
        prisma.product.findMany({
          where: {
            OR: [{ id: { in: productIds } }, { slug: { in: productIds } }],
          },
          select: { id: true, slug: true, name: true, basePrice: true, customizable: true },
        }),
        variantIds.length > 0
          ? prisma.productVariant.findMany({
              where: { id: { in: variantIds } },
              select: {
                id: true,
                productId: true,
                price: true,
                inStock: true,
                stockQuantity: true,
                name: true,
              },
            })
          : Promise.resolve([]),
        wallLayoutKeys.length > 0
          ? prisma.wallLayout.findMany({
              where: {
                OR: [
                  { slug: { in: wallLayoutKeys } },
                  { id: { in: wallLayoutKeys } },
                ],
              },
              select: { id: true, slug: true, basePrice: true, compareAtPrice: true },
            })
          : Promise.resolve([]),
        // Live garment prices (admin-editable `plain_*` products). Without this
        // the studio and the checkout could disagree after a price change.
        prisma.product.findMany({
          where: { id: { in: Object.keys(PLAIN_PRODUCT_TO_GARMENT) } },
          select: { id: true, basePrice: true, sizePrices: true },
        }),
      ]);
    };

    try {
      [dbProducts, dbVariants, dbWallLayouts, dbGarmentProducts] = await fetchCatalogData();
    } catch (firstErr) {
      console.warn('Initial DB catalog query failed, attempting reconnect and retry...', firstErr);
      try {
        await prisma.$connect().catch(() => {});
        [dbProducts, dbVariants, dbWallLayouts, dbGarmentProducts] = await fetchCatalogData();
      } catch (retryErr) {
        console.error('Database query error in checkout (after retry):', retryErr);
        const errMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
        return NextResponse.json(
          {
            success: false,
            message: `Database connection error during checkout (${errMsg}). Please try again.`,
          },
          { status: 500 },
        );
      }
    }

    // Build lookup maps
    const productMap = new Map<string, (typeof dbProducts)[number]>();
    for (const product of dbProducts) {
      productMap.set(product.id, product);
      if (product.slug) productMap.set(product.slug, product);
    }
    const variantMap = new Map(dbVariants.map((v) => [v.id, v]));
    // Index wall layouts by both slug and id for O(1) lookup inside the item loop
    const wallLayoutMap = new Map(
      dbWallLayouts.flatMap((wl) => [
        [wl.slug, wl],
        [wl.id, wl],
      ]),
    );

    // Merge live admin garment prices over the shared price table.
    const garmentPriceOverrides: Record<
      string,
      { basePrice: number; sizePrices: Record<string, number> }
    > = {};
    for (const gp of dbGarmentProducts) {
      const garmentId = PLAIN_PRODUCT_TO_GARMENT[gp.id];
      if (!garmentId) continue;
      const table = GARMENT_PRICING[garmentId];
      garmentPriceOverrides[garmentId] = {
        basePrice: gp.basePrice > 0 ? gp.basePrice : table?.basePrice ?? 639,
        sizePrices: {
          ...(table?.sizePrices ?? {}),
          ...(gp.sizePrices && typeof gp.sizePrices === 'object'
            ? (gp.sizePrices as Record<string, number>)
            : {}),
        },
      };
    }

    // 5. ──── Validate products, variants, stock ────
    let subtotal = 0;
    const validatedItems: Array<{
      productId: string;
      variantId: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      size: string | null;
      customization: unknown;
      productNameSnapshot: string;
      skuSnapshot: string | null;
    }> = [];

    for (const item of items) {
      // ──── Check if this is a Fregoro Wall Studio Product ────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const customData = item.customization as any;
      if (
        customData?.isWallProduct ||
        item.productId.startsWith('wall_') ||
        item.productId.startsWith('prebuilt_')
      ) {
        const layoutSlug = customData?.layoutSlug || customData?.layoutId || 'stepped-hero-05';
        const layout = getLayoutById(layoutSlug) || FREGORO_LAYOUTS[4];

        // Look up live DB price from the pre-fetched batch map (no additional DB round-trip)
        const dbLayout = wallLayoutMap.get(layoutSlug) ?? wallLayoutMap.get(layout.slug) ?? wallLayoutMap.get(layout.id);

        const effectiveLayout = dbLayout
          ? {
              ...layout,
              basePrice: dbLayout.basePrice,
              compareAtPrice: dbLayout.compareAtPrice ?? Math.round(dbLayout.basePrice * 1.35),
            }
          : layout;

        // Recalculate price deterministically on the server (never trust client)
        const serverPricing = calculateWallPrice(effectiveLayout, customData?.selections || {});
        const unitPrice = serverPricing.finalPrice;
        const totalItemPrice = unitPrice * item.quantity;
        subtotal += totalItemPrice;

        const productNameSnapshot = customData?.layoutName
          ? `${customData.layoutName} Wall Setup (${layout.physicalPrintCount} Prints)`
          : `${layout.name} Wall Setup (${layout.physicalPrintCount} Prints)`;
        const skuSnapshot = `${layout.slug}-v${layout.version}`;

        // Clone and upload any custom photo uploads to R2 if needed
        const processedCustomization = customData ? JSON.parse(JSON.stringify(customData)) : null;

        validatedItems.push({
          productId: item.productId,
          variantId: item.variantId || 'default',
          quantity: item.quantity,
          unitPrice,
          totalPrice: totalItemPrice,
          size: layout.coverageLabel,
          customization: processedCustomization,
          productNameSnapshot,
          skuSnapshot,
        });
        continue;
      }

      // ──── Check if this is a Studio Mockup Custom Garment ────
      // `mockup-2d-` is legacy (the studio is 3D-only now) but is still
      // accepted so carts saved before the 2D editor was removed still price.
      if (
        customData?.is3dMockup ||
        customData?.is2dMockup ||
        Boolean(customData?.garment) ||
        Boolean(customData?.apparelId) ||
        Boolean(PLAIN_PRODUCT_TO_GARMENT[item.productId]) ||
        item.variantId?.startsWith('mockup-3d-') ||
        item.variantId?.startsWith('mockup-2d-') ||
        item.productId === 'clothing-mockup' ||
        item.productId === 'prod_test_tees' ||
        item.productId.startsWith('apparel_') ||
        item.productId.startsWith('design-')
      ) {
        // Check for ₹1 test design
        const isDesign001 =
          item.productId === 'design-001' ||
          customData?.designId === 'design-001' ||
          (typeof item.price === 'number' && item.price === 1 && (item.productId.includes('design-001') || customData?.designId === 'design-001'));

        // Server-side price only. The client-submitted `item.price` and
        // `customData.basePrice` are never trusted — both are editable in the
        // browser. Prices below come from the DB catalogue or the fixed garment
        // price table in this file.
        let unitPrice = 639;

        if (isDesign001) {
          unitPrice = 1;
        } else {
          const garmentKey = (
            (typeof customData?.garment === 'string' ? customData.garment : '') +
            ' ' +
            (typeof customData?.garmentId === 'string' ? customData.garmentId : '') +
            ' ' +
            (typeof item.variantId === 'string' ? item.variantId : '') +
            ' ' +
            (typeof item.name === 'string' ? item.name : '') +
            ' ' +
            (typeof item.productId === 'string' ? item.productId : '')
          ).toLowerCase();

          // Resolve the physical garment + size deterministically. Prices come
          // from the shared table so the studio total and the charged total can
          // never drift apart.
          const resolvedGarmentId =
            normalizeGarmentId(typeof customData?.garment === 'string' ? customData.garment : null) ||
            normalizeGarmentId(typeof customData?.garmentId === 'string' ? customData.garmentId : null) ||
            normalizeGarmentId(typeof customData?.apparelId === 'string' ? customData.apparelId : null) ||
            normalizeGarmentId(typeof item.variantId === 'string' ? item.variantId : null) ||
            normalizeGarmentId(typeof item.name === 'string' ? item.name : null) ||
            normalizeGarmentId(typeof item.productId === 'string' ? item.productId : null) ||
            normalizeGarmentId(garmentKey) ||
            'regular-t-shirt';

          const garmentSize =
            (typeof item.size === 'string' && item.size) ||
            (typeof customData?.size === 'string' && customData.size) ||
            'L';

          const garmentBasePrice = getGarmentSizePrice(
            resolvedGarmentId,
            garmentSize,
            garmentPriceOverrides,
          );

          const isCurated = Boolean(customData?.designId && !customData?.isPlain);
          const rawArtworkCount =
            typeof customData?.customArtworkCount === 'number'
              ? customData.customArtworkCount
              : Array.isArray(customData?.uploadedArtworks)
                ? customData.uploadedArtworks.length
                : 0;
          const artworkCharge = getArtworkCharge(resolvedGarmentId, rawArtworkCount, {
            curated: isCurated,
          });

          if (isCurated) {
            const curatedDbProduct = customData?.designId
              ? productMap.get(customData.designId)
              : productMap.get(item.productId);
            const designBase =
              curatedDbProduct &&
              typeof curatedDbProduct.basePrice === 'number' &&
              curatedDbProduct.basePrice > 0
                ? curatedDbProduct.basePrice
                : 639;

            unitPrice = Math.max(designBase, garmentBasePrice) + artworkCharge;
          } else {
            unitPrice = garmentBasePrice + artworkCharge;
          }
        }

        const totalItemPrice = unitPrice * item.quantity;
        subtotal += totalItemPrice;

        const itemName = typeof item.name === 'string' ? item.name : undefined;
        const garmentTitle = (typeof customData?.garment === 'string' ? customData.garment : null) || itemName || 'Custom Garment';
        const colorName = customData?.color ? ` (${customData.color})` : '';
        const productNameSnapshot: string = itemName && itemName.startsWith('Custom ')
          ? itemName
          : `Custom ${garmentTitle}${colorName}`;
        const skuSnapshot = item.variantId || `mockup-3d-${item.productId}`;

        // Clone and upload any remaining base64 images to R2 if needed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const processedCustomization: any = customData ? JSON.parse(JSON.stringify(customData)) : {};

        const uploadKeys = [
          'designFileUrl',
          'frontDesignFileUrl',
          'backDesignFileUrl',
          'leftSleeveDesignFileUrl',
          'rightSleeveDesignFileUrl',
          'previewFileUrl',
          'currentPreviewFileUrl',
          'frontPreviewFileUrl',
          'backPreviewFileUrl',
          'leftSleevePreviewFileUrl',
          'rightSleevePreviewFileUrl',
          'frontPreviewUrl',
          'backPreviewUrl',
          'currentPreviewUrl',
          'leftSleevePreviewUrl',
          'rightSleevePreviewUrl',
          'thumbnail',
          'imageUrl',
        ];

        for (const key of uploadKeys) {
          if (
            processedCustomization[key] &&
            typeof processedCustomization[key] === 'string' &&
            processedCustomization[key].startsWith('data:image/')
          ) {
            try {
              const dataStr = processedCustomization[key];
              const matches = dataStr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              if (matches && matches.length === 3) {
                const contentType = matches[1];
                const base64Data = matches[2];
                const buffer = Buffer.from(base64Data, 'base64');

                const { objectKey } = await uploadBufferToR2(
                  buffer,
                  `custom_${item.productId}_${key}.png`,
                  contentType,
                );

                processedCustomization[key] = getR2PublicUrl(objectKey);
              }
            } catch (e) {
              console.error(`Error uploading ${key} to R2:`, e);
            }
          }
        }

        if (Array.isArray(processedCustomization.uploadedArtworks)) {
          for (let aIdx = 0; aIdx < processedCustomization.uploadedArtworks.length; aIdx++) {
            const art = processedCustomization.uploadedArtworks[aIdx];
            if (art && typeof art === 'object') {
              for (const k of ['dataUrl', 'url', 'previewUrl']) {
                if (art[k] && typeof art[k] === 'string' && art[k].startsWith('data:image/')) {
                  try {
                    const matches = art[k].match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                      const contentType = matches[1];
                      const base64Data = matches[2];
                      const buffer = Buffer.from(base64Data, 'base64');
                      const safeName = (art.name || `artwork_${aIdx}`).replace(/[^a-zA-Z0-9._-]/g, '_');
                      const { objectKey } = await uploadBufferToR2(
                        buffer,
                        `artwork_${item.productId}_${aIdx}_${safeName}.png`,
                        contentType,
                      );
                      art[k] = getR2PublicUrl(objectKey);
                      if (k === 'dataUrl') {
                        art.url = getR2PublicUrl(objectKey);
                      }
                    }
                  } catch (e) {
                    console.error('Error uploading artwork to R2:', e);
                  }
                }
              }
            }
          }
        }

        validatedItems.push({
          productId: item.productId || 'clothing-mockup',
          variantId: item.variantId || 'default',
          quantity: item.quantity,
          unitPrice,
          totalPrice: totalItemPrice,
          size: item.size || customData?.size || 'L',
          customization: processedCustomization,
          productNameSnapshot,
          skuSnapshot,
        });
        continue;
      }

      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, message: `Product "${item.productId}" not found.` },
          { status: 400 },
        );
      }

      let unitPrice = product.basePrice;
      let skuSnapshot: string | null = null;

      if (item.variantId && item.variantId !== 'default') {
        const variant = variantMap.get(item.variantId);
        if (variant) {
          if (!variant.inStock) {
            return NextResponse.json(
              {
                success: false,
                message: `"${product.name} — ${variant.name}" is currently out of stock.`,
              },
              { status: 409 },
            );
          }
          // If finite inventory is tracked (> 0) and product is not made-to-order
          if (
            !product.customizable &&
            variant.stockQuantity > 0 &&
            variant.stockQuantity < item.quantity
          ) {
            return NextResponse.json(
              {
                success: false,
                message: `Only ${variant.stockQuantity} of "${product.name} — ${variant.name}" available. You requested ${item.quantity}.`,
              },
              { status: 409 },
            );
          }
          unitPrice = variant.price;
          skuSnapshot = variant.id; // Use variant ID as SKU for now
        } else if (item.variantId.startsWith('mockup-3d-') || customData?.is3dMockup) {
          // 3D custom garment mockup uses live basePrice set by admin
          unitPrice = product.basePrice;
          skuSnapshot = item.variantId;
        } else {
          return NextResponse.json(
            { success: false, message: `Variant "${item.variantId}" not found.` },
            { status: 400 },
          );
        }
      }

      const totalItemPrice = unitPrice * item.quantity;
      subtotal += totalItemPrice;

      // ──── Upload customizations to R2 ────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processedCustomization: any = item.customization
        ? JSON.parse(JSON.stringify(item.customization))
        : null;

      if (processedCustomization && typeof processedCustomization === 'object') {
        const uploadKeys = [
          'designFileUrl',
          'frontDesignFileUrl',
          'backDesignFileUrl',
          'leftSleeveDesignFileUrl',
          'rightSleeveDesignFileUrl',
          'previewFileUrl',
          'currentPreviewFileUrl',
          'frontPreviewFileUrl',
          'backPreviewFileUrl',
          'leftSleevePreviewFileUrl',
          'rightSleevePreviewFileUrl',
          'frontPreviewUrl',
          'backPreviewUrl',
          'currentPreviewUrl',
          'leftSleevePreviewUrl',
          'rightSleevePreviewUrl',
          'thumbnail',
          'imageUrl',
        ];

        for (const key of uploadKeys) {
          if (
            processedCustomization[key] &&
            typeof processedCustomization[key] === 'string' &&
            processedCustomization[key].startsWith('data:image/')
          ) {
            try {
              const dataStr = processedCustomization[key];
              const matches = dataStr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              if (matches && matches.length === 3) {
                const contentType = matches[1];
                const base64Data = matches[2];
                const buffer = Buffer.from(base64Data, 'base64');

                const { objectKey } = await uploadBufferToR2(
                  buffer,
                  `custom_${item.productId}_${key}.png`,
                  contentType,
                );

                processedCustomization[key] = getR2PublicUrl(objectKey);
              }
            } catch (e) {
              console.error(`Error uploading ${key} to R2:`, e);
              // Fallback to storing base64 if R2 fails
            }
          }
        }

        // Upload custom 3D Mockup artwork layers if present in uploadedArtworks
        if (Array.isArray(processedCustomization.uploadedArtworks)) {
          for (let aIdx = 0; aIdx < processedCustomization.uploadedArtworks.length; aIdx++) {
            const art = processedCustomization.uploadedArtworks[aIdx];
            if (art && typeof art === 'object') {
              for (const k of ['dataUrl', 'url', 'previewUrl']) {
                if (art[k] && typeof art[k] === 'string' && art[k].startsWith('data:image/')) {
                  try {
                    const matches = art[k].match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                      const contentType = matches[1];
                      const base64Data = matches[2];
                      const buffer = Buffer.from(base64Data, 'base64');
                      const safeName = (art.name || `artwork_${aIdx}`).replace(/[^a-zA-Z0-9._-]/g, '_');
                      const { objectKey } = await uploadBufferToR2(
                        buffer,
                        `artwork_${item.productId}_${aIdx}_${safeName}.png`,
                        contentType,
                      );
                      art[k] = getR2PublicUrl(objectKey);
                    }
                  } catch (e) {
                    console.error('Error uploading artwork to R2:', e);
                  }
                }
              }
            }
          }
        }

        // Upload custom magazine page images if present in pagesData
        if (Array.isArray(processedCustomization.pagesData)) {
          for (let pIdx = 0; pIdx < processedCustomization.pagesData.length; pIdx++) {
            const page = processedCustomization.pagesData[pIdx];
            if (Array.isArray(page.elements)) {
              for (let elIdx = 0; elIdx < page.elements.length; elIdx++) {
                const el = page.elements[elIdx];
                if (el.src && typeof el.src === 'string' && el.src.startsWith('data:image/')) {
                  try {
                    const matches = el.src.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                      const contentType = matches[1];
                      const base64Data = matches[2];
                      const buffer = Buffer.from(base64Data, 'base64');
                      const { objectKey } = await uploadBufferToR2(
                        buffer,
                        `magazine_${item.productId}_p${page.pageNumber || pIdx + 1}_el${elIdx}.png`,
                        contentType,
                      );
                      el.src = getR2PublicUrl(objectKey);
                    }
                  } catch (e) {
                    console.error('Error uploading magazine page element image to R2:', e);
                  }
                }
              }
            }
            if (
              page.backgroundImage &&
              typeof page.backgroundImage === 'string' &&
              page.backgroundImage.startsWith('data:image/')
            ) {
              try {
                const matches = page.backgroundImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                  const { objectKey } = await uploadBufferToR2(
                    Buffer.from(matches[2], 'base64'),
                    `magazine_${item.productId}_p${page.pageNumber || pIdx + 1}_bg.png`,
                    matches[1],
                  );
                  page.backgroundImage = getR2PublicUrl(objectKey);
                }
              } catch (e) {
                console.error('Error uploading magazine page background to R2:', e);
              }
            }
          }
        }

        // Upload custom magazine images in document.pages if present
        if (
          processedCustomization.document &&
          Array.isArray(processedCustomization.document.pages)
        ) {
          for (let pIdx = 0; pIdx < processedCustomization.document.pages.length; pIdx++) {
            const page = processedCustomization.document.pages[pIdx];
            if (Array.isArray(page.elements)) {
              for (let elIdx = 0; elIdx < page.elements.length; elIdx++) {
                const el = page.elements[elIdx];
                const candidate =
                  el.src ||
                  (el.type === 'image' && typeof el.content === 'string' ? el.content : null);
                if (candidate && typeof candidate === 'string' && candidate.startsWith('data:image/')) {
                  try {
                    const matches = candidate.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                      const contentType = matches[1];
                      const base64Data = matches[2];
                      const buffer = Buffer.from(base64Data, 'base64');
                      const { objectKey } = await uploadBufferToR2(
                        buffer,
                        `magdoc_${item.productId}_p${pIdx + 1}_el${elIdx}.png`,
                        contentType,
                      );
                      const uploadedUrl = getR2PublicUrl(objectKey);
                      if (el.src) el.src = uploadedUrl;
                      else el.content = uploadedUrl;
                    }
                  } catch (e) {
                    console.error('Error uploading document page element image to R2:', e);
                  }
                }
              }
            }
            if (
              page.backgroundImage &&
              typeof page.backgroundImage === 'string' &&
              page.backgroundImage.startsWith('data:image/')
            ) {
              try {
                const matches = page.backgroundImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                  const { objectKey } = await uploadBufferToR2(
                    Buffer.from(matches[2], 'base64'),
                    `magdoc_${item.productId}_p${pIdx + 1}_bg.png`,
                    matches[1],
                  );
                  page.backgroundImage = getR2PublicUrl(objectKey);
                }
              } catch (e) {
                console.error('Error uploading document page background to R2:', e);
              }
            }
          }
        }
      }

      validatedItems.push({
        productId: item.productId,
        variantId: item.variantId || 'default',
        quantity: item.quantity,
        unitPrice,
        totalPrice: totalItemPrice,
        size: item.size || null,
        customization: processedCustomization,
        productNameSnapshot: product.name,
        skuSnapshot,
      });
    }

    // 6. ──── Apply coupon (with per-customer limit check) ────
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (coupon && coupon.isActive) {
        if (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date()) {
          if (!coupon.maxUses || coupon.usageCount < coupon.maxUses) {
            // Per-customer limit check
            if (coupon.perCustomerLimit && userId) {
              const userCouponUses = await prisma.order.count({
                where: {
                  userId,
                  couponCode: couponCode.toUpperCase(),
                  paymentStatus: { in: ['paid', 'pending'] },
                },
              });
              if (userCouponUses >= coupon.perCustomerLimit) {
                return NextResponse.json(
                  {
                    success: false,
                    message: 'You have already used this coupon the maximum number of times.',
                  },
                  { status: 400 },
                );
              }
            }

            if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
              return NextResponse.json(
                {
                  success: false,
                  message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.`,
                },
                { status: 400 },
              );
            }

            if (coupon.discountType === 'percentage') {
              discountAmount = subtotal * (coupon.discountValue / 100);
            } else if (coupon.discountType === 'flat') {
              discountAmount = coupon.discountValue;
            }
          }
        }
      }
    }

    // 7. ──── Calculate final amount ────
    // TODO: Implement shipping zone-based calculation when needed
    const shippingFee = 0;
    const tax = 0;
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee + tax);

    // 8. ──── Generate IDs ────
    const publicOrderId = generatePublicOrderId();
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);

    // 9. ──── Handle Cashfree payment order creation ────
    let paymentGatewayOrderId: string | null = null;
    let paymentSessionId: string | null = null;

    try {
      // Create unique Cashfree order ID based on public order ID
      const cfOrderId = publicOrderId.replace(/[^a-zA-Z0-9_-]/g, '_');

      // Clean phone number for Cashfree API (Cashfree requires standard 10-digit Indian phone)
      const rawPhone = (address.phone || '').replace(/[^0-9]/g, '');
      let cleanPhone = '9999999999';
      if (rawPhone.length === 10) {
        cleanPhone = rawPhone;
      } else if (rawPhone.length === 12 && rawPhone.startsWith('91')) {
        cleanPhone = rawPhone.slice(2);
      } else if (rawPhone.length >= 10) {
        cleanPhone = rawPhone.slice(-10);
      }

      // Cashfree production strictly enforces HTTPS for return_url and notify_url
      const cfEnvironment = getCashfreeEnvironment();
      const siteUrl = getSiteUrl(request);
      const isLocal = siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1');

      let returnUrl = `${siteUrl}/payment/status?order_id=${cfOrderId}`;
      if (cfEnvironment === 'production' && returnUrl.startsWith('http://')) {
        if (isLocal) {
          returnUrl = `https://fregorostudios.com/payment/status?order_id=${cfOrderId}`;
        } else {
          returnUrl = returnUrl.replace(/^http:\/\//i, 'https://');
        }
      }

      const notifyUrl =
        !isLocal && siteUrl.startsWith('https://')
          ? `${siteUrl}/api/webhooks/cashfree`
          : undefined;

      // Clean customer_id for Cashfree API: alphanumeric, min 3 chars, max 80 chars
      const rawCustId = userId || `guest_${cleanPhone || Date.now()}`;
      const cleanCustId = rawCustId.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || `cust_${Date.now()}`;

      // Clean customer name for Cashfree API: min 3 chars
      const rawName = (address.name || 'Valued Customer').trim().replace(/[^a-zA-Z0-9 ._-]/g, '');
      const cleanName = rawName.length >= 3 ? rawName.slice(0, 90) : 'Valued Customer';

      // Clean customer email
      const rawEmail = (address.email || '').trim().toLowerCase();
      const cleanEmail = rawEmail.includes('@') ? rawEmail : 'customer@fregorostudios.com';

      // Clean order amount: Cashfree requires minimum ₹1.00
      const orderAmount = Math.max(1, Math.round(totalAmount * 100) / 100);

      const cfOrder = await createCashfreeOrder({
        order_id: cfOrderId,
        order_amount: orderAmount,
        order_currency: 'INR',
        customer_details: {
          customer_id: cleanCustId,
          customer_name: cleanName,
          customer_email: cleanEmail,
          customer_phone: cleanPhone,
        },
        order_meta: {
          return_url: returnUrl,
          ...(notifyUrl ? { notify_url: notifyUrl } : {}),
        },
        order_note: `Fregoro Studios Order ${publicOrderId}`.slice(0, 200),
      });

      paymentGatewayOrderId = cfOrderId;
      paymentSessionId = cfOrder.payment_session_id;
    } catch (err) {
      const rawErrMsg = err instanceof Error ? err.message : String(err);
      console.error('Cashfree order creation failed:', rawErrMsg);

      let errorMsg = rawErrMsg || 'Payment gateway error. Please try again or contact support.';
      if (err instanceof Error && err.message) {
        try {
          const jsonStart = err.message.indexOf('{');
          if (jsonStart !== -1) {
            const parsed = JSON.parse(err.message.slice(jsonStart));
            if (parsed.message) errorMsg = parsed.message;
          }
        } catch {}
      }

      if (errorMsg.toLowerCase().includes('authentication failed')) {
        errorMsg =
          'Payment gateway authentication failed. Please verify your Cashfree credentials.';
      }

      return NextResponse.json(
        {
          success: false,
          message: errorMsg,
        },
        { status: 500 },
      );
    }

    const createOrderData = (targetUserId: string | null) => ({
      publicOrderId,
      userId: targetUserId,
      subtotal,
      discount: discountAmount,
      shippingFee,
      tax,
      total: totalAmount,
      currency: 'INR',
      status: 'pending_payment',
      paymentStatus: 'pending',
      paymentProvider: 'cashfree',
      paymentGatewayOrderId:
        paymentGatewayOrderId || publicOrderId.replace(/[^a-zA-Z0-9_-]/g, '_'),
      shippingAddress: address as unknown as Prisma.InputJsonValue,
      couponCode: couponCode?.toUpperCase() || null,
      estimatedDeliveryDate,
      items: {
        create: validatedItems.map((item) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cust = item.customization as Record<string, any> | null;
          let designFileUrl: string | null = null;
          let previewFileUrl: string | null = null;
          let printInstructions: string | null = null;
          let customerNotes: string | null = null;
          let designFileName: string | null = null;

          if (cust && typeof cust === 'object') {
            designFileUrl =
              cust.designFileUrl ||
              cust.frontDesignFileUrl ||
              cust.thumbnail ||
              cust.imageUrl ||
              null;
            previewFileUrl =
              cust.currentPreviewFileUrl ||
              cust.previewFileUrl ||
              cust.frontPreviewFileUrl ||
              cust.thumbnail ||
              null;
            printInstructions =
              cust.printInstructions ||
              (cust.bindingType
                ? `${cust.bindingType} | ${cust.paperWeight || ''} | ${cust.coverFinish || ''}`.trim()
                : null);
            customerNotes = cust.customerNotes || cust.magazineTitle || cust.instructions || null;
            designFileName =
              cust.fileName ||
              (cust.magazineTitle ? `${cust.magazineTitle}.pdf` : 'custom_artwork.png');

            if (!designFileUrl && Array.isArray(cust.pagesData)) {
              for (const p of cust.pagesData) {
                const pageObj = p as Record<string, unknown>;
                if (Array.isArray(pageObj?.elements)) {
                  const found = pageObj.elements.find(
                    (e) =>
                      e &&
                      typeof (e as Record<string, unknown>).src === 'string' &&
                      ((e as Record<string, unknown>).src as string).startsWith('http'),
                  );
                  if (found) {
                    designFileUrl = (found as Record<string, unknown>).src as string;
                    break;
                  }
                }
              }
            }
          }

          const hasCustomizationRecord = Boolean(
            designFileUrl || printInstructions || customerNotes,
          );

          return {
            productId: item.productId,
            variantId: item.variantId,
            productNameSnapshot: item.productNameSnapshot,
            skuSnapshot: item.skuSnapshot,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            size: item.size,
            customization: item.customization
              ? (item.customization as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            ...(hasCustomizationRecord
              ? {
                  orderCustomization: {
                    create: {
                      designFileUrl,
                      previewFileUrl,
                      designFileName,
                      printInstructions,
                      customerNotes,
                      productionStatus: 'pending',
                    },
                  },
                }
              : {}),
          };
        }),
      },
      statusHistory: {
        create: {
          oldStatus: null,
          newStatus: 'pending_payment',
          changedBy: 'system',
          note: 'Online payment order created',
        },
      },
    });

    let orderId: string;
    try {
      const newOrder = await prisma.order.create({
        data: createOrderData(userId),
      });
      orderId = newOrder.id;
    } catch (dbError) {
      console.warn('First order creation DB attempt failed, attempting reconnect and retry...', dbError);
      try {
        await prisma.$connect().catch(() => {});
        const newOrder = await prisma.order.create({
          data: createOrderData(userId),
        });
        orderId = newOrder.id;
      } catch (retryDbError) {
        console.error('Final DB order creation error (after retry):', retryDbError);
        const errMsg = retryDbError instanceof Error ? retryDbError.message : String(retryDbError);
        return NextResponse.json(
          { success: false, message: `Failed to create order in database: ${errMsg}` },
          { status: 500 },
        );
      }
    }

    // 12. ──── Return response ────
    return NextResponse.json({
      success: true,
      message: 'Order initiated',
      orderId,
      publicOrderId,
      paymentSessionId, // Cashfree payment session ID for frontend SDK
      cashfreeOrderId: publicOrderId.replace(/[^a-zA-Z0-9_-]/g, '_'),
      cashfreeEnvironment: getCashfreeEnvironment(),
      amount: totalAmount,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Checkout error:', error);
    return NextResponse.json(
      {
        success: false,
        message: errorMsg || 'Internal server error during checkout.',
        detail: errorMsg,
      },
      { status: 500 },
    );
  }
}
