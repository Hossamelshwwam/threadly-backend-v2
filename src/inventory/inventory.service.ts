import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InventoryDocument } from './schema/inventory.schema';
import { Model, Types } from 'mongoose';
import { ProductDocument } from '../product/schema/product.schema';
import { SellerDocument } from '../seller/schema/seller.schema';
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
  ) {}

  // ── helpers ───────────────────────────────────────────────────────────────────
  private assertValidObjectId(id: string, label: string) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException(`${label} not found`);
  }

  private normalizeText(value: string, label: string): string {
    const trimmed = value.trim();
    if (!trimmed) throw new BadRequestException(`${label} cannot be empty`);
    return trimmed;
  }

  private normalizeSku(value: string): string {
    return this.normalizeText(value, 'SKU').toUpperCase();
  }

  private isDuplicateKeyError(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      (err as { code?: number }).code === 11000
    );
  }

  private async assertSellerOwnsProduct(
    userId: string,
    role: string,
    productId: string,
  ) {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    if (role === 'admin') return { seller: null, product };

    const seller = await this.sellerModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!seller) throw new NotFoundException('Seller profile not found');
    if (seller.status !== 'approved')
      throw new ForbiddenException('Store not approved');
    if (
      !product.sellerId ||
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
    const { product } = await this.assertSellerOwnsProduct(
      userId,
      role,
      productId,
    );

    const sku = this.normalizeSku(body.sku);
    const size = this.normalizeText(body.size, 'Size');
    const color = this.normalizeText(body.color, 'Color');

    const existing = await this.inventoryModel.findOne({
      productId: product._id,
      size,
      color,
    });
    if (existing)
      throw new ConflictException(
        'A variant with this size and color already exists',
      );

    const skuTaken = await this.inventoryModel.findOne({ sku });
    if (skuTaken) throw new ConflictException('SKU already in use');

    try {
      const variant = await this.inventoryModel.create({
        productId: product._id,
        ...body,
        sku,
        size,
        color,
      });
      return variant;
    } catch (err) {
      if (this.isDuplicateKeyError(err))
        throw new ConflictException(
          'A variant with this size, color or SKU already exists',
        );
      throw err;
    }
  }

  // ── Bulk create variants ──────────────────────────────────────────────────────
  async bulkCreateVariants(
    userId: string,
    role: string,
    productId: string,
    input: BulkCreateVariantsDto,
  ) {
    const { product } = await this.assertSellerOwnsProduct(
      userId,
      role,
      productId,
    );

    const payload = input.variants.map((v) => ({
      sku: this.normalizeSku(v.sku),
      size: this.normalizeText(v.size, 'Size'),
      color: this.normalizeText(v.color, 'Color'),
      stock: v.stock,
      price: v.price,
    }));

    // Check for duplicate SKUs within the request
    const skus = payload.map((v) => v.sku);
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
    const combos = payload.map((v) => `${v.size}|${v.color}`);
    if (new Set(combos).size !== combos.length)
      throw new BadRequestException(
        'Duplicate size+color combinations in request',
      );

    // Check for size+color combos already used by this product
    const existingCombos = await this.inventoryModel
      .find({
        productId: product._id,
        $or: payload.map((v) => ({ size: v.size, color: v.color })),
      })
      .select('size color');
    if (existingCombos.length > 0)
      throw new ConflictException(
        `Variants already exist for: ${existingCombos
          .map((v) => `${v.size}/${v.color}`)
          .join(', ')}`,
      );

    try {
      const variants = await this.inventoryModel.insertMany(
        payload.map((v) => ({ productId: product._id, ...v })),
      );
      return variants;
    } catch (err) {
      if (this.isDuplicateKeyError(err))
        throw new ConflictException(
          'A variant with this size, color or SKU already exists',
        );
      throw err;
    }
  }

  // ── List variants for a product ───────────────────────────────────────────────
  async listVariants(productId: string) {
    this.assertValidObjectId(productId, 'Product');

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
    this.assertValidObjectId(variantId, 'Variant');

    const variant = await this.inventoryModel.findById(variantId);
    if (!variant) throw new NotFoundException('Variant not found');

    await this.assertSellerOwnsProduct(
      userId,
      role,
      variant.productId.toString(),
    );

    const sku =
      body.sku !== undefined ? this.normalizeSku(body.sku) : undefined;
    const size =
      body.size !== undefined
        ? this.normalizeText(body.size, 'Size')
        : undefined;
    const color =
      body.color !== undefined
        ? this.normalizeText(body.color, 'Color')
        : undefined;

    // SKU must stay unique across the collection
    if (sku !== undefined && sku !== variant.sku) {
      const skuTaken = await this.inventoryModel.findOne({
        sku,
        _id: { $ne: variant._id },
      });
      if (skuTaken) throw new ConflictException('SKU already in use');
    }

    // Only check the combo when size or color actually changes
    const nextSize = size ?? variant.size;
    const nextColor = color ?? variant.color;
    if (nextSize !== variant.size || nextColor !== variant.color) {
      const collision = await this.inventoryModel.findOne({
        productId: variant.productId,
        size: nextSize,
        color: nextColor,
        _id: { $ne: variant._id },
      });
      if (collision)
        throw new ConflictException(
          'A variant with this size and color already exists',
        );
    }

    // stock is absolute: it can never drop below what pending orders hold
    if (body.stock !== undefined && body.stock < variant.reserved)
      throw new BadRequestException(
        `Stock cannot be lower than the reserved quantity (${variant.reserved})`,
      );

    if (sku !== undefined) variant.sku = sku;
    if (size !== undefined) variant.size = size;
    if (color !== undefined) variant.color = color;
    if (body.stock !== undefined) variant.stock = body.stock;
    if (body.price !== undefined) variant.price = body.price;

    try {
      await variant.save();
    } catch (err) {
      if (this.isDuplicateKeyError(err))
        throw new ConflictException(
          'A variant with this size, color or SKU already exists',
        );
      throw err;
    }

    return variant;
  }

  // ── Delete variant ────────────────────────────────────────────────────────────
  async deleteVariant(userId: string, role: string, variantId: string) {
    this.assertValidObjectId(variantId, 'Variant');

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

    this.assertValidObjectId(variantId, 'Variant');

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
