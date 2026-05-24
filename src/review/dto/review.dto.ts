import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createReviewSchema = z.object({
  orderItemId: z.string().min(1, 'Order item ID is required'),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(5).max(2000),
});

export class CreateReviewDto extends createZodDto(createReviewSchema) {}

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  rating: z.coerce.number().min(1).max(5).optional(),
  sort: z
    .enum(['newest', 'oldest', 'rating_asc', 'rating_desc'])
    .default('newest'),
});

export class ListReviewsQueryDto extends createZodDto(listReviewsQuerySchema) {}
