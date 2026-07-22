'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { assertAdmin, assertStaff } from './auth';

// ═══════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════

export async function updateOrderStatus(orderId: string, status: string) {
  await assertStaff();
  await prisma.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function updateOrderInternalNotes(orderId: string, notes: string) {
  await assertStaff();
  await prisma.order.update({ where: { id: orderId }, data: { internalNotes: notes } });
  revalidatePath(`/admin/orders/${orderId}`);
}

// ═══════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════

export async function toggleVariantStock(variantId: string, inStock: boolean) {
  await assertStaff();
  await prisma.productVariant.update({ where: { id: variantId }, data: { inStock } });
  revalidatePath('/admin/products');
}

export async function deleteProduct(productId: string) {
  await assertStaff();
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath('/admin/products');
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
  await assertStaff();
  const product = await prisma.product.create({ data });
  revalidatePath('/admin/products');
  revalidatePath('/products');
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
  await assertStaff();
  await prisma.product.update({ where: { id: productId }, data });
  revalidatePath('/admin/products');
  revalidatePath('/products');
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
  await assertStaff();
  await prisma.productVariant.create({ data });
  revalidatePath(`/admin/products/${data.productId}/edit`);
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
  await assertStaff();
  await prisma.productVariant.update({ where: { id: variantId }, data });
  revalidatePath('/admin/products');
}

export async function deleteVariant(variantId: string) {
  await assertStaff();
  await prisma.productVariant.delete({ where: { id: variantId } });
  revalidatePath('/admin/products');
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
  expiresAt?: Date;
  maxUses?: number;
  perCustomerLimit?: number;
  minOrderValue?: number;
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
    minOrderValue?: number;
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
