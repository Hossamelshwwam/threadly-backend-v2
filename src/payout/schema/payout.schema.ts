import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'rejected';

export type PayoutDocument = HydratedDocument<Payout>;

@Schema({ timestamps: true })
export class Payout {
  @Prop({
    type: Types.ObjectId,
    ref: 'Seller',
    required: true,
  })
  sellerId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Order',
    required: true,
  })
  orderId: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  amount: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  platformFee: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  netAmount: number;

  @Prop({
    type: String,
    enum: ['pending', 'processing', 'paid', 'rejected'],
    default: 'pending',
  })
  status: PayoutStatus;

  @Prop({
    type: String,
  })
  adminNote?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  processedBy?: Types.ObjectId;
}

export const PayoutSchema = SchemaFactory.createForClass(Payout);

PayoutSchema.index({ sellerId: 1 });
PayoutSchema.index({ orderId: 1 });
PayoutSchema.index({ status: 1 });
PayoutSchema.index({ createdAt: -1 });
