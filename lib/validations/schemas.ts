import { z } from 'zod';

export const AddressSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  street: z.string().min(3, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip: z.string().min(4, 'ZIP / Postal code is required'),
  country: z.string().default('India'),
  phone: z.string().optional(),
});

export const CartItemCustomizationSchema = z.object({
  color: z.string(),
  text: z.string(),
  textFont: z.string(),
  imageUrl: z.string().nullable(),
});

export const CartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().min(1, 'Variant ID is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  price: z.number().positive('Price must be greater than 0'),
  size: z.string().optional(),
  customization: CartItemCustomizationSchema.nullable().optional(),
});

export const CheckoutSchema = z.object({
  items: z.array(CartItemSchema).min(1, 'Cart cannot be empty'),
  address: AddressSchema,
  paymentMethod: z.enum(['upi', 'card', 'netbanking', 'cod']).default('upi'),
});

export const CustomizerSaveSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  title: z.string().optional().default('My Custom Design'),
  canvasState: z.record(z.string(), z.unknown()),
  previewUrl: z.string().optional(),
});
