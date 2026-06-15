import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ _id: true })
export class Address {
  _id?: Types.ObjectId;

  @Prop({ type: String, trim: true, default: 'Home' })
  label?: string;

  @Prop({ type: String, required: true, trim: true })
  street: string;

  @Prop({ type: String, required: true, trim: true })
  city: string;

  @Prop({ type: String, trim: true })
  state?: string;

  @Prop({ type: String, required: true, trim: true })
  postalCode: string;

  @Prop({ type: String, required: true, trim: true })
  country: string;

  @Prop({ type: Boolean, default: false })
  isDefault: boolean;

  @Prop({ type: String, trim: true })
  phonenumber: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
