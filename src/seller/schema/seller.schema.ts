import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

type SellerStatus = 'pending' | 'approved' | 'suspended';

@Schema({ _id: false })
export class BankDetails {
  @Prop({ type: String, required: true })
  accountName: string;
  @Prop({ type: String, required: true })
  accountNumber: string;
  @Prop({ type: String, required: true })
  bankName: string;
}

export const BankDetailsSchema = SchemaFactory.createForClass(BankDetails);

export type SellerDocument = HydratedDocument<Seller>;

@Schema({ timestamps: true })
export class Seller {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    minlength: [2, 'Store name must be at least 2 characters'],
    maxlength: [80, 'Store name cannot exceed 80 characters'],
  })
  storeName: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens',
    ],
  })
  storeSlug: string;

  @Prop({
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  })
  description?: string;

  @Prop({ type: String })
  logo?: string;

  @Prop({ type: String })
  banner?: string;

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'suspended'],
    default: 'pending',
  })
  status: SellerStatus;

  @Prop({
    type: BankDetailsSchema,
  })
  bankDetails: BankDetails;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  })
  rating: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  totalSales: number;

  @Prop({
    type: String,
  })
  adminNote?: string;
}

export const SellerSchema = SchemaFactory.createForClass(Seller);
