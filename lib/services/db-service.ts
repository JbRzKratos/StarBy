/**
 * Data service — always serves from local static files.
 *
 * Catalogue data (products, categories, devices) is now stored in
 * data/*.ts and uploaded to Cloudflare R2 as JSON.
 * The database is only used for user/order/auth data.
 */
import { products as staticProducts, type Product } from '@/data/products';
import { categories as staticCategories, type Category } from '@/data/categories';
import { deviceModels as staticDeviceModels, type DeviceModel } from '@/data/devices';

export async function getProductsFromDB(): Promise<Product[]> {
  return staticProducts;
}

export async function getCategoriesFromDB(): Promise<Category[]> {
  return staticCategories;
}

export async function getDeviceModelsFromDB(): Promise<DeviceModel[]> {
  return staticDeviceModels;
}
