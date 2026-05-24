import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10).max(5000),
  categoryId: z.string().min(1, 'Category is required'),
  sellerId: z.string().optional(),
  basePrice: z.coerce.number().min(0),
  status: z.enum(['draft', 'active']).default('draft'),
  attributes: z
    .array(z.object({ key: z.string().min(1), value: z.string().min(1) }))
    .optional()
    .default([]),
});

export class CreateProductDto extends createZodDto(createProductSchema) {}

export const updateProductSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  categoryId: z.string().optional(),
  sellerId: z.string().optional(),
  basePrice: z.coerce.number().min(0).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  attributes: z
    .array(z.object({ key: z.string().min(1), value: z.string().min(1) }))
    .optional(),
});

export class UpdateProductDto extends createZodDto(updateProductSchema) {}

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.string().optional(),
  seller: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  search: z.string().optional(),
  sort: z
    .enum(['newest', 'price_asc', 'price_desc', 'rating'])
    .default('newest'),
  status: z.enum(['draft', 'active', 'archived']).optional(),
});

export class ListProductsQueryDto extends createZodDto(
  listProductsQuerySchema,
) {}

export const deleteProductImageSchema = z.object({
  imageUrl: z.string().url('A valid image URL is required'),
});

export class DeleteProductImageDto extends createZodDto(
  deleteProductImageSchema,
) {}
