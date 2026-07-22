'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role !== 'ADMIN') throw new Error('Not authorized');
}

export async function updateOrderStatus(orderId: string, status: string) {
  await checkAdmin();
  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
  revalidatePath('/admin/orders');
}

export async function toggleVariantStock(variantId: string, inStock: boolean) {
  await checkAdmin();
  await prisma.productVariant.update({
    where: { id: variantId },
    data: { inStock },
  });
  revalidatePath('/admin/products');
}

export async function deleteProduct(productId: string) {
  await checkAdmin();
  await prisma.product.delete({
    where: { id: productId },
  });
  revalidatePath('/admin/products');
}

export async function addProduct(data: { name: string; slug: string; categorySlug: string; basePrice: number; tagline: string; description: string }) {
  await checkAdmin();
  await prisma.product.create({
    data: {
      ...data,
      customizable: false,
      featured: false,
    },
  });
  revalidatePath('/admin/products');
}
