import { prisma } from '@/lib/prisma';
import { products as staticProducts, type Product } from '@/data/products';
import { categories as staticCategories, type Category } from '@/data/categories';
import { deviceModels as staticDeviceModels, type DeviceModel } from '@/data/devices';

export async function getProductsFromDB(): Promise<Product[]> {
  try {
    const dbProducts = await prisma.product.findMany({
      include: {
        variants: true,
      },
    });

    if (dbProducts && dbProducts.length > 0) {
      return dbProducts.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        categorySlug: p.categorySlug,
        basePrice: p.basePrice,
        customizable: p.customizable,
        tags: p.tags,
        featured: p.featured,
        sizes: p.sizes,
        variants: p.variants.map((v) => ({
          id: v.id,
          name: v.name,
          color: v.color,
          colorHex: v.colorHex,
          price: v.price,
          images: v.images,
          inStock: v.inStock,
        })),
      }));
    }
  } catch {
    // Database connection or table not yet initialized — fallback to static products
  }
  return staticProducts;
}

export async function getCategoriesFromDB(): Promise<Category[]> {
  try {
    const dbCategories = await prisma.category.findMany();
    if (dbCategories && dbCategories.length > 0) {
      return dbCategories.map((c) => {
        const item: Category = {
          slug: c.slug,
          name: c.name,
          description: c.description,
          tagline: c.tagline,
          productCount: c.productCount,
          featured: c.featured,
          gradient: c.gradient,
        };
        if (c.image) item.image = c.image;
        return item;
      });
    }
  } catch {
    // Fallback to static categories
  }
  return staticCategories;
}

export async function getDeviceModelsFromDB(): Promise<DeviceModel[]> {
  try {
    const dbDevices = await prisma.deviceSkinTemplate.findMany();
    if (dbDevices && dbDevices.length > 0) {
      return dbDevices.map((d) => {
        const item: Record<string, unknown> = {
          id: d.id,
          name: d.name,
          brand: d.brand,
          type: d.type as 'mobile' | 'laptop',
          aspectRatio: d.aspectRatio,
          borderRadius: d.borderRadius,
          sPenSilo: d.sPenSilo,
          confidence: d.confidence as 'verified' | 'estimated',
        };
        if (d.cameraModule) item.cameraModule = d.cameraModule;
        if (d.logoCutout) item.logoCutout = d.logoCutout;
        if (d.notes) item.notes = d.notes;
        return item as unknown as DeviceModel;
      });
    }
  } catch {
    // Fallback to static devices
  }
  return staticDeviceModels;
}
