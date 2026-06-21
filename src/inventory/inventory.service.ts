import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InventoryDocument } from './schema/inventory.schema';
import { Model } from 'mongoose';
import { ProductDocument } from 'src/product/schema/product.schema';
import { SellerDocument } from 'src/seller/schema/seller.schema';
import {
  BulkCreateVariantsDto,
  CreateVariantDto,
  UpdateVariantDto,
} from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel('Inventory')
    private readonly inventoryModel: Model<InventoryDocument>,
    @InjectModel('Product')
    private readonly productModel: Model<ProductDocument>,
    @InjectModel('Seller')
    private readonly sellerModel: Model<SellerDocument>,
  ) { }

  // ── helpers ───────────────────────────────────────────────────────────────────
  private async assertSellerOwnsProduct(
    userId: string,
    role: string,
    productId: string,
  ) {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    if (role === 'admin') return { seller: null, product };

    const seller = await this.sellerModel.findOne({ userId });
    if (!seller) throw new NotFoundException('Seller profile not found');
    if (seller.status !== 'approved')
      throw new ForbiddenException('Store not approved');
    if (
      product.sellerId &&
      product.sellerId.toString() !== seller._id.toString()
    )
      throw new ForbiddenException('Forbidden');

    return { seller, product };
  }

  // ── Create single variant ─────────────────────────────────────────────────────
  async createVariant(
    userId: string,
    role: string,
    productId: string,
    body: CreateVariantDto,
  ) {
    const { product } = await this.assertSellerOwnsProduct(userId, role, productId);

    const existing = await this.inventoryModel.findOne({
      productId,
      size: body.size,
      color: body.color,
    });
    if (existing)
      throw new ConflictException(
        'A variant with this size and color already exists',
      );

    const skuTaken = await this.inventoryModel.findOne({
      sku: body.sku.toUpperCase(),
    });
    if (skuTaken) throw new ConflictException('SKU already in use');

    const variant = await this.inventoryModel.create({ productId: product._id, ...body });
    return variant;
  }

  // ── Bulk create variants ──────────────────────────────────────────────────────
  async bulkCreateVariants(
    userId: string,
    role: string,
    productId: string,
    input: BulkCreateVariantsDto,
  ) {
    await this.assertSellerOwnsProduct(userId, role, productId);

    // Check for duplicate SKUs within the request
    const skus = input.variants.map((v) => v.sku.toUpperCase());
    if (new Set(skus).size !== skus.length)
      throw new BadRequestException('Duplicate SKUs in request');

    // Check for existing SKUs in DB
    const existingSkus = await this.inventoryModel
      .find({ sku: { $in: skus } })
      .distinct('sku');
    if (existingSkus.length > 0)
      throw new ConflictException(
        `SKUs already in use: ${existingSkus.join(', ')}`,
      );

    // Check for duplicate size+color combos within request
    const combos = input.variants.map((v) => `${v.size}|${v.color}`);
    if (new Set(combos).size !== combos.length)
      throw new BadRequestException(
        'Duplicate size+color combinations in request',
      );

    const variants = await this.inventoryModel.insertMany(
      input.variants.map((v) => ({ productId, ...v })),
    );
    return variants;
  }

  // ── List variants for a product ───────────────────────────────────────────────
  async listVariants(productId: string) {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    const variants = await this.inventoryModel
      .find({ productId: product._id })
      .sort({
        size: 1,
        color: 1,
      });
    return variants;
  }

  // ── Update variant ────────────────────────────────────────────────────────────
  async updateVariant(
    userId: string,
    role: string,
    variantId: string,
    body: UpdateVariantDto,
  ) {
    const variant = await this.inventoryModel.findById(variantId);
    if (!variant) throw new NotFoundException('Variant not found');

    await this.assertSellerOwnsProduct(
      userId,
      role,
      variant.productId.toString(),
    );

    // Check no collision if size or color changed
    if (body.size || body.color) {
      const newSize = body.size ?? variant.size;
      const newColor = body.color ?? variant.color;
      const collision = await this.inventoryModel.findOne({
        productId: variant.productId,
        size: newSize,
        color: newColor,
        _id: { $ne: variant._id },
      });
      if (collision)
        throw new ConflictException(
          'A variant with this size and color already exists',
        );
      if (body.size) variant.size = body.size;
      if (body.color) variant.color = body.color;
    }

    if (body.sku) variant.sku = body.sku;
    if (body.stock !== undefined) variant.stock = body.stock;
    if (body.price !== undefined) variant.price = body.price;

    await variant.save();
    return variant;
  }

  // ── Delete variant ────────────────────────────────────────────────────────────
  async deleteVariant(userId: string, role: string, variantId: string) {
    const variant = await this.inventoryModel.findById(variantId);
    if (!variant) throw new NotFoundException('Variant not found');

    await this.assertSellerOwnsProduct(
      userId,
      role,
      variant.productId.toString(),
    );

    if (variant.reserved > 0)
      throw new BadRequestException(
        'Cannot delete a variant with reserved stock (pending orders)',
      );

    await variant.deleteOne();
  }

  // ── Restock ───────────────────────────────────────────────────────────────────
  async restockVariant(
    userId: string,
    role: string,
    variantId: string,
    quantity: number,
  ) {
    if (quantity <= 0)
      throw new BadRequestException('Quantity must be positive');

    const variant = await this.inventoryModel.findById(variantId);
    if (!variant) throw new NotFoundException('Variant not found');

    await this.assertSellerOwnsProduct(
      userId,
      role,
      variant.productId.toString(),
    );

    variant.stock += quantity;
    await variant.save();
    return variant;
  }
}
