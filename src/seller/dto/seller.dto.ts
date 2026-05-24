import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const registerSellerSchema = z.object({
  storeName: z.string().min(2).max(80),
  description: z.string().max(1000).optional(),
  accountName: z.string().min(2),
  accountNumber: z.string().min(5),
  bankName: z.string().min(2),
});

export class RegisterSellerDto extends createZodDto(registerSellerSchema) {}

export const updateSellerSchema = z.object({
  storeName: z.string().min(2).max(80).optional(),
  description: z.string().max(1000).optional(),
  accountName: z.string().min(2).optional(),
  accountNumber: z.string().min(5).optional(),
  bankName: z.string().min(2).optional(),
});

export class UpdateSellerDto extends createZodDto(updateSellerSchema) {}

export const adminUpdateSellerStatusSchema = z.object({
  status: z.enum(['approved', 'suspended']),
  adminNote: z.string().max(500).optional(),
});

export class AdminUpdateSellerStatusDto extends createZodDto(
  adminUpdateSellerStatusSchema,
) {}

export const adminListSellersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['pending', 'approved', 'suspended']).optional(),
});

export class AdminListSellersQueryDto extends createZodDto(
  adminListSellersQuerySchema,
) {}
