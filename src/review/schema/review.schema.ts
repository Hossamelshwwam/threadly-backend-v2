import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({ timestamps: true })
export class Review {
  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  productId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  buyerId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'OrderItem',
    required: true,
    unique: true,
  })
  orderItemId: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    min: 1,
    max: 5,
  })
  rating: number;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  })
  comment: string;

  @Prop({
    type: [String],
    validate: {
      validator: (v: string[]) => v.length <= 5,
      message: 'Max 5 images',
    },
    default: [],
  })
  images: string[];

  @Prop({
    type: Boolean,
    default: false,
  })
  verified: boolean;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ productId: 1 });

ReviewSchema.index({ buyerId: 1 });

ReviewSchema.index({ orderItemId: 1 }, { unique: true });
