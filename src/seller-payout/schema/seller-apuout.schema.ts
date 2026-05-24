import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'rejected';

export type SellerPayoutDocument = HydratedDocument<SellerPayout>;

@Schema({ timestamps: true })
export class SellerPayout {
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

export const SellerPayoutSchema = SchemaFactory.createForClass(SellerPayout);

SellerPayoutSchema.index({ sellerId: 1 });
SellerPayoutSchema.index({ orderId: 1 });
SellerPayoutSchema.index({ status: 1 });
SellerPayoutSchema.index({ createdAt: -1 });
