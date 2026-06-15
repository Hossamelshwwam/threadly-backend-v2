import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const placeOrderSchema = z.object({
  paymentMethod: z.enum(['credit_card', 'cash_on_delivery']),
  addressId: z.string().nonempty({ message: 'Address is required' }),
});

export class PlaceOrderDto extends createZodDto(placeOrderSchema) {}

export const updateOrderItemStatusSchema = z.object({
  status: z.enum(['processing', 'shipped', 'delivered', 'cancelled']),
  trackingNumber: z.string().optional(),
});

export class UpdateOrderItemStatusDto extends createZodDto(
  updateOrderItemStatusSchema,
) {}

export const adminUpdateOrderSchema = z.object({
  paymentStatus: z.enum(['unpaid', 'paid', 'refunded']).optional(),
  status: z
    .enum([
      'pending',
      'confirmed',
      'partially_shipped',
      'shipped',
      'delivered',
      'cancelled',
    ])
    .optional(),
});

export class AdminUpdateOrderDto extends createZodDto(adminUpdateOrderSchema) {}

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export class ListOrdersQueryDto extends createZodDto(listOrdersQuerySchema) {}
