import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  inventoryId: z.string().min(1, 'Inventory ID is required'),
  quantity: z.coerce.number().min(1).max(100),
});

export class AddToCartDto extends createZodDto(addToCartSchema) {}

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().min(1).max(100),
});

export class UpdateCartItemDto extends createZodDto(updateCartItemSchema) {}
