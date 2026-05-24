import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InventoryDocument = HydratedDocument<Inventory>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Inventory {
  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  productId: Types.ObjectId;

  @Prop({
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true,
  })
  sku: string;

  @Prop({
    type: String,
    required: [true, 'Size is required'],
    trim: true,
  })
  size: string;

  @Prop({
    type: String,
    required: [true, 'Color is required'],
    trim: true,
  })
  color: string;

  @Prop({
    type: Number,
    required: true,
    min: [0, 'Stock cannot be negative'],
    default: 0,
  })
  stock: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  reserved: number;

  @Prop({
    type: Number,
    required: [true, 'Variant price is required'],
    min: [0, 'Price cannot be negative'],
  })
  price: number;

  // virtual
  available: number;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);

// Virtual: available = stock - reserved
InventorySchema.virtual('available').get(function () {
  return Math.max(0, this.stock - this.reserved);
});

InventorySchema.index({ productId: 1 });

InventorySchema.index({ productId: 1, size: 1, color: 1 }, { unique: true });
