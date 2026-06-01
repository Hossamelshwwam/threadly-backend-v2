import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2).max(60),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export class CreateCategoryDto extends createZodDto(createCategorySchema) {}

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(60).optional(),
  parentId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export class UpdateCategoryDto extends createZodDto(updateCategorySchema) {}

export const adminListCategoriesQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  active: z.enum(['true', 'false']).optional(),
});

export class AdminListCategoriesQueryDto extends createZodDto(
  adminListCategoriesQuerySchema,
) {}
