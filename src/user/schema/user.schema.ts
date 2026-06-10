import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Address, AddressSchema } from './address.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
})
export class User {
  @Prop({
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [80, 'Name cannot exceed 80 characters'],
  })
  name: string;

  @Prop({
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  })
  email: string;

  @Prop({ type: String, trim: true })
  avatar?: string;

  @Prop({ type: String, required: true, select: false })
  passwordHash: string;

  @Prop({ type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' })
  role: string;

  @Prop({ type: String, trim: true })
  phone?: string;

  @Prop({
    type: [AddressSchema],
    default: [],
    validate: {
      validator: (v: Address[]) => v.length <= 10,
      message: 'Cannot save more than 10 addresses',
    },
  })
  addresses: Address[];

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  @Prop({ type: String, select: false })
  verificationToken?: string;

  @Prop({ type: Date, select: false })
  verificationTokenExpiry?: Date;

  @Prop({ type: String, select: false })
  passwordResetToken?: string;

  @Prop({ type: Date, select: false })
  passwordResetExpiry?: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ role: 1 });
