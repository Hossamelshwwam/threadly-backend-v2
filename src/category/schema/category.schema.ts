import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [60, 'Category name cannot exceed 60 characters'],
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
    type: Types.ObjectId,
    ref: 'Category',
    default: null,
  })
  parentId?: Types.ObjectId | null;

  @Prop({
    type: String,
  })
  image?: string;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index({ parentId: 1 });
CategorySchema.index({ isActive: 1 });
