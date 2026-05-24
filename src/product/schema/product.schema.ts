import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductStatus = 'draft' | 'active' | 'archived';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ _id: false })
export class Attribute {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  key: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  value: string;
}

export const AttributeSchema = SchemaFactory.createForClass(Attribute);

@Schema({ timestamps: true })
export class Product {
  @Prop({
    type: Types.ObjectId,
    ref: 'Seller',
    required: false,
    default: null,
  })
  sellerId: Types.ObjectId | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  categoryId: Types.ObjectId;

  @Prop({
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters'],
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  slug: string;

  @Prop({
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
  })
  description: string;

  @Prop({
    type: [String],
    validate: {
      validator: (v: string[]) => v.length <= 8,
      message: 'A product can have at most 8 images',
    },
  })
  images: string[];

  @Prop({
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative'],
  })
  basePrice: number;

  @Prop({
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft',
  })
  status: ProductStatus;

  @Prop({
    type: [AttributeSchema],
    default: [],
  })
  attributes: Attribute[];

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
  reviewCount: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ sellerId: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ status: 1 });

ProductSchema.index({
  name: 'text',
  description: 'text',
});

ProductSchema.index({ basePrice: 1 });
ProductSchema.index({ rating: -1 });
