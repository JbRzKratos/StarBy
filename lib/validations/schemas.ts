import { z } from 'zod';

export const AddressSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP / Postal code is required'),
  country: z.string().optional().default('India'),
  phone: z.string().optional(),
});

export const CartItemCustomizationSchema = z.record(z.string(), z.unknown()).nullable().optional();

export const CartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional().default('default'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  price: z.number().nonnegative('Price must be 0 or greater'),
  size: z.string().nullable().optional(),
  customization: z.unknown().nullable().optional(),
}).passthrough();

export const CheckoutSchema = z.object({
  items: z.array(CartItemSchema).min(1, 'Cart cannot be empty'),
  address: AddressSchema,
  paymentMethod: z.enum(['upi', 'card', 'netbanking', 'cod']).default('upi'),
  couponCode: z.string().optional(),
});

export const CustomizerSaveSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  title: z.string().optional().default('My Custom Design'),
  canvasState: z.record(z.string(), z.unknown()),
  previewUrl: z.string().optional(),
});
