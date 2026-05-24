import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'partially_shipped'
  | 'shipped'
  | 'delivered'
  | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type PaymentMethod = 'credit_card' | 'cash_on_delivery';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class ShippingAddress {
  @Prop({ type: String, required: true })
  fullName: string;
  @Prop({ type: String, required: true })
  street: string;
  @Prop({ type: String, required: true })
  city: string;
  @Prop({ type: String })
  state: string;
  @Prop({ type: String, required: true })
  postalCode: string;
  @Prop({ type: String, required: true })
  country: string;
  @Prop({ type: String })
  phone: string;
}

export const ShippingAddressSchema =
  SchemaFactory.createForClass(ShippingAddress); // schema = mongoose schema

@Schema({ timestamps: true })
export class Order {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  buyerId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  orderNumber: string;

  @Prop({
    type: String,
    enum: [
      'pending',
      'confirmed',
      'partially_shipped',
      'shipped',
      'delivered',
      'cancelled',
    ],
    default: 'pending',
  })
  status: OrderStatus;

  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress: ShippingAddress;

  @Prop({ type: Number, required: true, min: 0 })
  subtotal: number;

  @Prop({ type: Number, required: true, min: 0 })
  total: number;

  @Prop({
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid',
  })
  paymentStatus: PaymentStatus;

  @Prop({
    type: String,
    enum: ['credit_card', 'cash_on_delivery'],
    required: true,
  })
  paymentMethod: PaymentMethod;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ buyerId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });
