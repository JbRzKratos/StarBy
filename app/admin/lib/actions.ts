'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { assertAdmin, assertStaff } from './auth';
import { dispatchNotification } from '@/lib/notifications';

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
  revalidatePath(`/admin/orders/${orderId}`);
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

export async function toggleVariantStock(variantId: string, inStock: boolean) {
  await assertStaff();
  await prisma.productVariant.update({ where: { id: variantId }, data: { inStock } });
  revalidatePath('/admin/products');
}

export async function deleteProduct(productId: string) {
  await assertAdmin();
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath('/admin/products');
  revalidatePath('/products');
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
}) {
  await assertAdmin();
  const product = await prisma.product.create({
    data: {
      ...data,
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
  revalidatePath('/admin/products');
  revalidatePath('/products');
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
  },
) {
  // Price changes strictly require admin access
  if (data.basePrice !== undefined) {
    await assertAdmin();
  } else {
    await assertStaff();
  }
  await prisma.product.update({ where: { id: productId }, data });
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath('/products');
  revalidatePath('/products/[category]', 'page');
  revalidatePath('/products/[category]/[slug]', 'page');
  revalidatePath('/', 'layout');
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
  await prisma.productVariant.create({ data });
  revalidatePath(`/admin/products/${data.productId}/edit`);
  revalidatePath('/admin/products');
  revalidatePath('/products');
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
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${variant.productId}/edit`);
  revalidatePath('/products');
  revalidatePath('/', 'layout');
}

export async function deleteVariant(variantId: string) {
  await assertAdmin();
  await prisma.productVariant.delete({ where: { id: variantId } });
  revalidatePath('/admin/products');
  revalidatePath('/products');
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
  currency: string;
  taxRate: number;
  maintenanceMode: boolean;
}) {
  await assertAdmin();
  await prisma.storeSettings.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      storeName: data.storeName,
      contactEmail: data.contactEmail,
      taxRate: data.taxRate,
    },
    update: {
      storeName: data.storeName,
      contactEmail: data.contactEmail,
      taxRate: data.taxRate,
    },
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
