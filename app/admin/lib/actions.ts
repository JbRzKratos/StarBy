'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { assertAdmin, assertStaff } from './auth';
import { dispatchNotification } from '@/lib/notifications';
import { invalidateProductsCache } from '@/lib/services/products-service';

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const aKeys = Object.keys(a as Record<string, unknown>);
  const bKeys = Object.keys(b as Record<string, unknown>);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) =>
    deepEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ),
  );
}

/** Size maps historically stored both "M" and "m"; compare case-insensitively. */
function normalizeSizeMap(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const normalized: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    normalized[key.trim().toUpperCase()] = entry;
  }
  return normalized;
}

// ═══════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════

export async function updateOrderStatus(orderId: string, status: string, note?: string) {
  const staff = await assertStaff();

  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      statusHistory: {
        create: {
          oldStatus: existingOrder?.status || null,
          newStatus: status,
          changedBy: staff?.id || 'staff',
          note: note || `Order status updated to ${status} by admin/staff`,
        },
      },
    },
    include: { user: true },
  });

  const emailTo = order.user?.email || (order.shippingAddress as Record<string, string>)?.email;
  const name =
    order.user?.fullName || (order.shippingAddress as Record<string, string>)?.name || 'Customer';

  if (emailTo) {
    if (status === 'shipped') {
      await dispatchNotification('ORDER_SHIPPED', {
        orderId: order.id,
        publicOrderId: order.publicOrderId || undefined,
        customerName: name,
        customerEmail: emailTo,
        trackingUrl: order.trackingUrl || undefined,
        trackingNumber: order.trackingNumber || undefined,
        carrier: order.carrier || undefined,
      });
    } else if (status === 'delivered') {
      await dispatchNotification('ORDER_DELIVERED', {
        orderId: order.id,
        publicOrderId: order.publicOrderId || undefined,
        customerName: name,
        customerEmail: emailTo,
      });
    }
  }

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  if (order.userId) {
    revalidatePath(`/admin/customers/${order.userId}`);
  }
  revalidatePath('/account/orders');
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}/track`);
}

export async function updateOrderInternalNotes(orderId: string, notes: string) {
  await assertStaff();
  await prisma.order.update({ where: { id: orderId }, data: { internalNotes: notes } });
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function updateOrderTracking(
  orderId: string,
  tracking: { carrier: string; trackingNumber: string; trackingUrl: string },
) {
  const staff = await assertStaff();
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: {
      carrier: tracking.carrier,
      trackingNumber: tracking.trackingNumber,
      trackingUrl: tracking.trackingUrl,
      statusHistory: {
        create: {
          oldStatus: existingOrder?.status || null,
          newStatus: existingOrder?.status || 'shipped',
          changedBy: staff?.id || 'staff',
          note: `Tracking added: ${tracking.carrier || 'Courier'} - ${tracking.trackingNumber}`,
        },
      },
    },
  });
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}/track`);
}

// ═══════════════════════════════════════
// PRODUCTS & PRICING
// ═══════════════════════════════════════

/**
 * Update product base price.
 * STRICT SECURITY: ONLY ADMIN access users can change product prices.
 */
export async function updateProductPrice(
  productId: string,
  newBasePrice: number,
  syncVariants: boolean = false,
) {
  // Enforce ADMIN role check (throws if not admin)
  await assertAdmin();

  if (typeof newBasePrice !== 'number' || isNaN(newBasePrice) || newBasePrice < 0) {
    throw new Error('Invalid price: must be a positive number or zero.');
  }

  const sanitized = Math.round(newBasePrice * 100) / 100;

  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: { basePrice: sanitized },
    include: { variants: true },
  });

  // Optionally propagate base price to variants (e.g. if single variant or requested)
  if (syncVariants) {
    await prisma.productVariant.updateMany({
      where: { productId },
      data: { price: sanitized },
    });
  }

  // Synchronize with Wall Studio tables if this is a Wall Studio layout or Prebuilt Wall
  if (updatedProduct.categorySlug === 'wall-studio' || productId.startsWith('wall_')) {
    const layoutSlug = updatedProduct.slug.replace(/^wall-layout-/, '').replace(/^wall_/, '');
    const cleanId = productId.replace(/^wall_/, '');
    try {
      await prisma.wallLayout.updateMany({
        where: {
          OR: [
            { slug: layoutSlug },
            { id: cleanId },
            { id: productId },
            { slug: updatedProduct.slug },
          ],
        },
        data: { basePrice: sanitized },
      });
    } catch (e) {
      console.warn('Could not update wallLayout in sync:', e);
    }
  }

  if (updatedProduct.categorySlug === 'wall-studio' || productId.startsWith('prebuilt_')) {
    const prebuiltSlug = updatedProduct.slug.replace(/^prebuilt-wall-/, '').replace(/^prebuilt_/, '');
    const cleanId = productId.replace(/^prebuilt_/, '');
    try {
      await prisma.prebuiltWallProduct.updateMany({
        where: {
          OR: [
            { slug: prebuiltSlug },
            { id: cleanId },
            { id: productId },
            { slug: updatedProduct.slug },
          ],
        },
        data: { basePrice: sanitized },
      });
    } catch (e) {
      console.warn('Could not update prebuiltWallProduct in sync:', e);
    }
  }

  // Bust cache across entire storefront and admin paths
  invalidateProductsCache();
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath('/products');
  revalidatePath('/products/[category]', 'page');
  revalidatePath('/products/[category]/[slug]', 'page');
  revalidatePath('/wall-studio');
  revalidatePath('/api/wall-studio/layouts');
  revalidatePath('/split-poster');
  revalidatePath('/magazine');
  revalidatePath('/api/products/prices');
  revalidatePath('/cart');
  revalidatePath('/checkout');
  revalidatePath('/', 'layout');

  return { success: true, basePrice: sanitized, product: updatedProduct };
}

/**
 * Update product variant price.
 * STRICT SECURITY: ONLY ADMIN access users can change variant prices.
 */
export async function updateVariantPrice(variantId: string, newPrice: number) {
  // Enforce ADMIN role check (throws if not admin)
  await assertAdmin();

  if (typeof newPrice !== 'number' || isNaN(newPrice) || newPrice < 0) {
    throw new Error('Invalid price: must be a positive number or zero.');
  }

  const sanitized = Math.round(newPrice * 100) / 100;

  const updatedVariant = await prisma.productVariant.update({
    where: { id: variantId },
    data: { price: sanitized },
  });

  invalidateProductsCache();
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${updatedVariant.productId}/edit`);
  revalidatePath('/products');
  revalidatePath('/products/[category]', 'page');
  revalidatePath('/products/[category]/[slug]', 'page');
  revalidatePath('/wall-studio');
  revalidatePath('/api/wall-studio/layouts');
  revalidatePath('/split-poster');
  revalidatePath('/magazine');
  revalidatePath('/api/products/prices');
  revalidatePath('/cart');
  revalidatePath('/checkout');
  revalidatePath('/', 'layout');

  return { success: true, price: sanitized, variant: updatedVariant };
}

/**
 * Update all products base price in a given category.
 * STRICT SECURITY: ONLY ADMIN access users can change product prices.
 */
export async function batchUpdateCategoryPrice(
  categorySlug: string | string[],
  newBasePrice: number,
  syncVariants: boolean = true,
) {
  await assertAdmin();

  if (typeof newBasePrice !== 'number' || isNaN(newBasePrice) || newBasePrice < 0) {
    throw new Error('Invalid price: must be a positive number or zero.');
  }

  const sanitized = Math.round(newBasePrice * 100) / 100;

  const requestedSlugs = (Array.isArray(categorySlug) ? categorySlug : [categorySlug])
    .map((slug) => slug.trim())
    .filter(Boolean);

  const targetCategories = Array.from(
    new Set(
      requestedSlugs.flatMap((slug) =>
        slug === 'tees' ? ['tees', 'oversized-tees'] : [slug],
      ),
    ),
  );

  if (targetCategories.length === 0) {
    throw new Error('No category selected.');
  }

  const products = await prisma.product.findMany({
    where: { categorySlug: { in: targetCategories } },
    select: { id: true },
  });

  if (products.length === 0) {
    throw new Error(`No products found in category "${targetCategories.join(' / ')}".`);
  }

  await prisma.product.updateMany({
    where: { categorySlug: { in: targetCategories } },
    data: { basePrice: sanitized },
  });

  if (syncVariants) {
    await prisma.productVariant.updateMany({
      where: { productId: { in: products.map((p) => p.id) } },
      data: { price: sanitized },
    });
  }

  invalidateProductsCache();
  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/products/[category]', 'page');
  revalidatePath('/products/[category]/[slug]', 'page');
  revalidatePath('/wall-studio');
  revalidatePath('/split-poster');
  revalidatePath('/magazine');
  revalidatePath('/api/products/prices');
  revalidatePath('/cart');
  revalidatePath('/checkout');
  revalidatePath('/', 'layout');

  return { success: true, count: products.length, newPrice: sanitized };
}

export async function toggleVariantStock(variantId: string, inStock: boolean) {
  await assertStaff();
  await prisma.productVariant.update({ where: { id: variantId }, data: { inStock } });
  invalidateProductsCache();
  revalidatePath('/admin/products');
}

export async function updateVariantStockQuantity(variantId: string, stockQuantity: number) {
  await assertStaff();
  const sanitized = Math.max(0, Math.floor(stockQuantity));
  const updated = await prisma.productVariant.update({
    where: { id: variantId },
    data: { stockQuantity: sanitized, inStock: sanitized > 0 },
  });
  invalidateProductsCache();
  revalidatePath('/admin/products');
  return { success: true, variant: updated };
}

export async function deleteProduct(productId: string) {
  await assertAdmin();
  await prisma.product.delete({ where: { id: productId } });
  invalidateProductsCache();
  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/products/[category]', 'page');
  revalidatePath('/products/[category]/[slug]', 'page');
  revalidatePath('/api/products');
  revalidatePath('/api/products/prices');
  revalidatePath('/', 'layout');
}

export async function createProduct(data: {
  name: string;
  slug: string;
  categorySlug: string;
  basePrice: number;
  tagline: string;
  description: string;
  customizable: boolean;
  featured: boolean;
  tags: string[];
  sizes: string[];
  sizePrices?: Record<string, number> | null;
  sizeStock?: Record<string, unknown> | null;
}) {
  await assertAdmin();
  const { sizePrices, sizeStock, ...rest } = data;
  const product = await prisma.product.create({
    data: {
      ...rest,
      ...(sizePrices !== undefined
        ? { sizePrices: sizePrices ? (sizePrices as Prisma.InputJsonValue) : Prisma.DbNull }
        : {}),
      ...(sizeStock !== undefined
        ? { sizeStock: sizeStock ? (sizeStock as Prisma.InputJsonValue) : Prisma.DbNull }
        : {}),
      variants: {
        create: [
          {
            name: 'Standard',
            color: 'Default',
            colorHex: '#0E0E0F',
            price: data.basePrice,
            images: [],
            inStock: true,
            stockQuantity: 100,
            reorderThreshold: 5,
          },
        ],
      },
    },
    include: { variants: true },
  });
  invalidateProductsCache();
  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/products/[category]', 'page');
  revalidatePath('/products/[category]/[slug]', 'page');
  revalidatePath('/magazine');
  revalidatePath('/magazine/templates');
  revalidatePath('/api/admin/magazine-templates');
  revalidatePath('/api/products');
  revalidatePath('/api/products/prices');
  revalidatePath('/', 'layout');
  return product;
}

export async function updateProduct(
  productId: string,
  data: {
    name?: string;
    slug?: string;
    categorySlug?: string;
    basePrice?: number;
    tagline?: string;
    description?: string;
    customizable?: boolean;
    featured?: boolean;
    tags?: string[];
    sizes?: string[];
    sizePrices?: Record<string, number> | null;
    sizeStock?: Record<string, unknown> | null;
  },
) {
  await assertStaff();

  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: { basePrice: true, sizePrices: true, sizeStock: true },
  });
  if (!existing) throw new Error('Product not found');

  // Price and stock changes strictly require admin access. A staff member can
  // still edit copy (name, description, tags) without tripping the price gate.
  const priceChanged = data.basePrice !== undefined && data.basePrice !== existing.basePrice;
  const sizePricesChanged =
    data.sizePrices !== undefined &&
    !deepEqual(normalizeSizeMap(data.sizePrices), normalizeSizeMap(existing.sizePrices));
  const sizeStockChanged =
    data.sizeStock !== undefined &&
    !deepEqual(normalizeSizeMap(data.sizeStock), normalizeSizeMap(existing.sizeStock));

  if (priceChanged || sizePricesChanged || sizeStockChanged) {
    await assertAdmin();
  }

  const { sizePrices, sizeStock, ...rest } = data;
  const updatePayload: Prisma.ProductUpdateInput = {
    ...rest,
    ...(sizePrices !== undefined
      ? { sizePrices: sizePrices ? (sizePrices as Prisma.InputJsonValue) : Prisma.DbNull }
      : {}),
    ...(sizeStock !== undefined
      ? { sizeStock: sizeStock ? (sizeStock as Prisma.InputJsonValue) : Prisma.DbNull }
      : {}),
  };

  const updated = await prisma.product.update({ where: { id: productId }, data: updatePayload });

  // Revalidate across all storefront and admin paths
  invalidateProductsCache();
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath('/products');
  revalidatePath('/products/[category]', 'page');
  revalidatePath('/products/[category]/[slug]', 'page');
  revalidatePath('/magazine');
  revalidatePath('/magazine/templates');
  revalidatePath('/api/admin/magazine-templates');
  revalidatePath('/api/products');
  revalidatePath('/api/products/prices');
  revalidatePath('/cart');
  revalidatePath('/checkout');
  revalidatePath('/', 'layout');

  return updated;
}

/**
 * Fast update of size pricing and size stock inventory from the admin products table.
 */
export async function updateProductSizePricingAndStock(
  productId: string,
  sizePrices: Record<string, number>,
  sizeStock: Record<string, unknown>,
) {
  await assertAdmin();

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      sizePrices: sizePrices ? (sizePrices as Prisma.InputJsonValue) : Prisma.DbNull,
      sizeStock: sizeStock ? (sizeStock as Prisma.InputJsonValue) : Prisma.DbNull,
    },
  });

  // Note: size-level inventory is stored on Product.sizeStock. Do not
  // redistribute it across variants — variant stock is managed separately and
  // an even split destroys the real per-colour quantities.

  invalidateProductsCache();
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath('/products');
  revalidatePath('/products/[category]', 'page');
  revalidatePath('/products/[category]/[slug]', 'page');
  revalidatePath('/api/products/prices');
  revalidatePath('/cart');
  revalidatePath('/checkout');
  revalidatePath('/', 'layout');

  return { success: true, product: updated };
}

/**
 * Fast inline update of product title/name from admin table or quick action.
 * Propagates live changes to all storefront product pages, catalog, cart, and Wall Studio.
 */
export async function updateProductName(productId: string, newName: string) {
  await assertStaff();

  if (!newName || typeof newName !== 'string' || newName.trim().length === 0) {
    throw new Error('Product name cannot be empty.');
  }

  const trimmed = newName.trim();

  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: { name: trimmed },
    include: { variants: true },
  });

  // Synchronize with Wall Studio tables if this is a Wall Studio layout or Prebuilt Wall
  if (updatedProduct.categorySlug === 'wall-studio' || productId.startsWith('wall_')) {
    const layoutSlug = updatedProduct.slug.replace(/^wall-layout-/, '').replace(/^wall_/, '');
    const cleanId = productId.replace(/^wall_/, '');
    try {
      await prisma.wallLayout.updateMany({
        where: {
          OR: [
            { slug: layoutSlug },
            { id: cleanId },
            { id: productId },
            { slug: updatedProduct.slug },
          ],
        },
        data: { name: trimmed },
      });
    } catch (e) {
      console.warn('Could not update wallLayout in sync:', e);
    }
  }

  if (updatedProduct.categorySlug === 'wall-studio' || productId.startsWith('prebuilt_')) {
    const prebuiltSlug = updatedProduct.slug.replace(/^prebuilt-wall-/, '').replace(/^prebuilt_/, '');
    const cleanId = productId.replace(/^prebuilt_/, '');
    try {
      await prisma.prebuiltWallProduct.updateMany({
        where: {
          OR: [
            { slug: prebuiltSlug },
            { id: cleanId },
            { id: productId },
            { slug: updatedProduct.slug },
          ],
        },
        data: { title: trimmed },
      });
    } catch (e) {
      console.warn('Could not update prebuiltWallProduct in sync:', e);
    }
  }

  // Bust cache across entire storefront and customer routes
  invalidateProductsCache();
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath('/products');
  revalidatePath('/products/[category]', 'page');
  revalidatePath('/products/[category]/[slug]', 'page');
  revalidatePath('/api/products');
  revalidatePath('/api/products/prices');
  revalidatePath('/cart');
  revalidatePath('/checkout');
  revalidatePath('/', 'layout');

  return { success: true, name: trimmed, product: updatedProduct };
}

export async function createVariant(data: {
  productId: string;
  name: string;
  color: string;
  colorHex: string;
  price: number;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  reorderThreshold: number;
}) {
  await assertAdmin();
  const variant = await prisma.productVariant.create({ data });
  invalidateProductsCache();
  revalidatePath(`/admin/products/${data.productId}/edit`);
  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/products/[category]', 'page');
  revalidatePath('/products/[category]/[slug]', 'page');
  revalidatePath('/api/products');
  revalidatePath('/api/products/prices');
  revalidatePath('/', 'layout');
  return variant;
}

export async function updateVariant(
  variantId: string,
  data: {
    name?: string;
    color?: string;
    colorHex?: string;
    price?: number;
    inStock?: boolean;
    stockQuantity?: number;
    reorderThreshold?: number;
  },
) {
  // Price changes strictly require admin access
  if (data.price !== undefined) {
    await assertAdmin();
  } else {
    await assertStaff();
  }
  const variant = await prisma.productVariant.update({ where: { id: variantId }, data });
  invalidateProductsCache();
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${variant.productId}/edit`);
  revalidatePath('/products');
  revalidatePath('/products/[category]', 'page');
  revalidatePath('/products/[category]/[slug]', 'page');
  revalidatePath('/api/products');
  revalidatePath('/api/products/prices');
  revalidatePath('/', 'layout');
  return variant;
}

export async function deleteVariant(variantId: string) {
  await assertAdmin();
  const existing = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { productId: true },
  });
  await prisma.productVariant.delete({ where: { id: variantId } });
  invalidateProductsCache();
  revalidatePath('/admin/products');
  if (existing?.productId) {
    revalidatePath(`/admin/products/${existing.productId}/edit`);
  }
  revalidatePath('/products');
  revalidatePath('/products/[category]', 'page');
  revalidatePath('/products/[category]/[slug]', 'page');
  revalidatePath('/api/products');
  revalidatePath('/api/products/prices');
  revalidatePath('/', 'layout');
}

// ═══════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════

export async function createCategory(data: {
  slug: string;
  name: string;
  description: string;
  tagline: string;
  gradient: string;
}) {
  await assertStaff();
  await prisma.category.create({ data });
  revalidatePath('/admin/categories');
}

export async function updateCategory(
  categoryId: string,
  data: { name?: string; description?: string; tagline?: string; gradient?: string },
) {
  await assertStaff();
  await prisma.category.update({ where: { id: categoryId }, data });
  revalidatePath('/admin/categories');
}

export async function deleteCategory(categoryId: string) {
  await assertStaff();
  // Check for assigned products first
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw new Error('Category not found');
  const count = await prisma.product.count({ where: { categorySlug: category.slug } });
  if (count > 0) throw new Error(`Cannot delete: ${count} product(s) still assigned`);
  await prisma.category.delete({ where: { id: categoryId } });
  revalidatePath('/admin/categories');
}

// ═══════════════════════════════════════
// CUSTOMERS
// ═══════════════════════════════════════

export async function updateCustomerNotes(userId: string, notes: string) {
  await assertStaff();
  await prisma.user.update({ where: { id: userId }, data: { notes } });
  revalidatePath(`/admin/customers/${userId}`);
}

// ═══════════════════════════════════════
// COUPONS (admin only)
// ═══════════════════════════════════════

export async function createCoupon(data: {
  code: string;
  discountType: string;
  discountValue: number;
  isActive: boolean;
  expiresAt?: Date | null;
  maxUses?: number | null;
  perCustomerLimit?: number | null;
  minOrderValue?: number | null;
}) {
  await assertAdmin();
  await prisma.coupon.create({ data });
  revalidatePath('/admin/coupons');
}

export async function updateCoupon(
  couponId: string,
  data: {
    code?: string;
    discountType?: string;
    discountValue?: number;
    isActive?: boolean;
    expiresAt?: Date | null;
    maxUses?: number | null;
    perCustomerLimit?: number | null;
    minOrderValue?: number | null;
  },
) {
  await assertAdmin();
  await prisma.coupon.update({ where: { id: couponId }, data });
  revalidatePath('/admin/coupons');
}

export async function deleteCoupon(couponId: string) {
  await assertAdmin();
  await prisma.coupon.delete({ where: { id: couponId } });
  revalidatePath('/admin/coupons');
}

export async function toggleCoupon(couponId: string, isActive: boolean) {
  await assertAdmin();
  await prisma.coupon.update({ where: { id: couponId }, data: { isActive } });
  revalidatePath('/admin/coupons');
}

// ═══════════════════════════════════════
// STAFF (admin only)
// ═══════════════════════════════════════

export async function setUserRole(userId: string, role: 'CUSTOMER' | 'STAFF' | 'ADMIN') {
  await assertAdmin();
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath('/admin/staff');
}

export async function promoteToStaff(email: string) {
  await assertAdmin();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User with this email not found');
  await prisma.user.update({ where: { id: user.id }, data: { role: 'STAFF' } });
  revalidatePath('/admin/staff');
}

export async function demoteToCustomer(userId: string) {
  await assertAdmin();
  await prisma.user.update({ where: { id: userId }, data: { role: 'CUSTOMER' } });
  revalidatePath('/admin/staff');
}

// ═══════════════════════════════════════
// SETTINGS (admin only)
// ═══════════════════════════════════════

export async function upsertStoreSettings(data: {
  storeName: string;
  contactEmail: string;
  taxRate: number;
  newOrderEmail: boolean;
}) {
  await assertAdmin();
  await prisma.storeSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  });
  revalidatePath('/admin/settings');
}

export async function updateSettings(data: {
  id?: string;
  storeName: string;
  contactEmail: string;
  taxRate: number;
}) {
  await assertAdmin();
  const targetId = data.id?.trim() || 'singleton';
  const payload = {
    storeName: data.storeName,
    contactEmail: data.contactEmail,
    taxRate: data.taxRate,
  };

  await prisma.storeSettings.upsert({
    where: { id: targetId },
    create: { id: targetId, ...payload },
    update: payload,
  });
  revalidatePath('/admin/settings');
}

export async function createShippingZone(data: {
  name: string;
  states: string[];
  rateType: string;
  rateValue: number;
}) {
  await assertAdmin();
  await prisma.shippingZone.create({ data });
  revalidatePath('/admin/settings');
}

export async function updateShippingZone(
  zoneId: string,
  data: { name?: string; states?: string[]; rateType?: string; rateValue?: number },
) {
  await assertAdmin();
  await prisma.shippingZone.update({ where: { id: zoneId }, data });
  revalidatePath('/admin/settings');
}

export async function deleteShippingZone(zoneId: string) {
  await assertAdmin();
  await prisma.shippingZone.delete({ where: { id: zoneId } });
  revalidatePath('/admin/settings');
}
