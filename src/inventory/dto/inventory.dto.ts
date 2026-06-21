import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createVariantSchema = z.object({
  sku: z.string().min(2).max(50),
  size: z.string().min(1).max(20),
  color: z.string().min(1).max(50),
  stock: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
});

export class CreateVariantDto extends createZodDto(createVariantSchema) { }

export const updateVariantSchema = z.object({
  sku: z.string().min(1).max(20).optional(),
  stock: z.coerce.number().min(0).optional(),
  price: z.coerce.number().min(0).optional(),
  size: z.string().min(1).max(20).optional(),
  color: z.string().min(1).max(50).optional(),
});

export class UpdateVariantDto extends createZodDto(updateVariantSchema) { }

export const bulkCreateVariantsSchema = z.object({
  variants: z.array(createVariantSchema).min(1).max(50),
});

export class BulkCreateVariantsDto extends createZodDto(
  bulkCreateVariantsSchema,
) { }

export const restockVariantSchema = z.object({
  quantity: z.number().min(1).max(50),
});

export class RestockVariantDto extends createZodDto(restockVariantSchema) { }
