import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CartDocument = HydratedDocument<Cart>;

@Schema({ _id: false })
export class CartItem {
  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  productId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Inventory',
    required: true,
  })
  inventoryId: Types.ObjectId;

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
  priceSnapshot: number;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({ timestamps: true })
export class Cart {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: [CartItemSchema],
    default: [],
  })
  items: CartItem[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
