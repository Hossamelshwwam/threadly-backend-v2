import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updatePayoutStatusSchema = z.object({
  status: z.enum(['processing', 'paid', 'rejected']),
  adminNote: z.string().max(500).optional(),
});

export class UpdatePayoutStatusDto extends createZodDto(
  updatePayoutStatusSchema,
) {}

export const listPayoutsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['pending', 'processing', 'paid', 'rejected']).optional(),
  seller: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export class ListPayoutsQueryDto extends createZodDto(listPayoutsQuerySchema) {}
