import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().min(5).max(20).optional(),
});

export class UpdateProfileDto extends createZodDto(updateProfileSchema) {}

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}

export const addAddressSchema = z.object({
  label: z.string().max(30).default('Home'),
  street: z.string().min(2).max(200),
  city: z.string().min(2).max(100),
  state: z.string().optional(),
  postalCode: z.string().min(2).max(20),
  country: z.string().min(2).max(100),
  isDefault: z.boolean().default(false),
});

export class AddAddressDto extends createZodDto(addAddressSchema) {}

export const updateAddressSchema = addAddressSchema.partial();

export class UpdateAddressDto extends createZodDto(updateAddressSchema) {}

export const getAllAdminsQueryDto = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  role: z.enum(['buyer', 'seller', 'admin']).optional(),
  search: z.string().optional(),
});

export class GetAllAdminsQueryDto extends createZodDto(getAllAdminsQueryDto) {}

export const updateAdminDto = z.object({
  isActive: z.boolean(),
});

export class UpdateAdminDto extends createZodDto(updateAdminDto) {}
