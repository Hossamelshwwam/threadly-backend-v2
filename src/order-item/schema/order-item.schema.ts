import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderItemStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type OrderItemDocument = HydratedDocument<OrderItem>;

@Schema({ timestamps: true })
export class OrderItem {
  @Prop({
    type: Types.ObjectId,
    ref: 'Order',
    required: true,
  })
  orderId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  productId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Seller',
    required: false,
    default: null,
  })
  sellerId?: Types.ObjectId | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'Inventory',
    required: true,
  })
  inventoryId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  productName: string;

  @Prop({
    type: String,
  })
  productImage?: string;

  @Prop({
    type: String,
    required: true,
  })
  size: string;

  @Prop({
    type: String,
    required: true,
  })
  color: string;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  quantity: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  unitPrice: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  total: number;

  @Prop({
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  })
  status: OrderItemStatus;

  @Prop({
    type: String,
  })
  trackingNumber?: string;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

OrderItemSchema.index({ orderId: 1 });
OrderItemSchema.index({ sellerId: 1 });
OrderItemSchema.index({ productId: 1 });
OrderItemSchema.index({ status: 1 });
