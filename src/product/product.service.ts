import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ProductDocument } from './schema/product.schema';
import { Model } from 'mongoose';
import { SellerDocument } from 'src/seller/schema/seller.schema';
import { CategoryDocument } from 'src/category/schema/category.schema';
import { InventoryDocument } from 'src/inventory/schema/inventory.schema';
import {
  CreateProductDto,
  ListProductsQueryDto,
  UpdateProductDto,
} from './dto/product.dto';
import { PaginationService } from 'src/common/services/pagination.service';
import { SlugService } from 'src/common/services/slug.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel('Product')
    private readonly productModel: Model<ProductDocument>,
    @InjectModel('Seller')
    private readonly sellerModel: Model<SellerDocument>,
    @InjectModel('Category')
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel('Inventory')
    private readonly inventoryModel: Model<InventoryDocument>,
    private readonly paginationService: PaginationService,
    private readonly slugService: SlugService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ── helpers ───────────────────────────────────────────────────────────────────
  async getApprovedSeller(userId: string, role: string) {
    if (role === 'admin') return null;
    const seller = await this.sellerModel.findOne({ userId });
    if (!seller) throw new NotFoundException('Seller profile not found');
    if (seller.status !== 'approved')
      throw new ForbiddenException('Your store is not approved yet');
    return seller;
  }

  async assertProductOwner(
    productId: string,
    sellerId: string | null,
    role: string,
  ) {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('Product not found');
    if (
      role !== 'admin' &&
      product.sellerId &&
      product.sellerId.toString() !== sellerId
    )
      throw new ForbiddenException('Forbidden');
    return product;
  }

  // ── Create ────────────────────────────────────────────────────────────────────
  async createProduct(userId: string, role: string, input: CreateProductDto) {
    const seller = await this.getApprovedSeller(userId, role);

    if (role === 'admin' && input.sellerId) {
      const sellerExists = await this.sellerModel.findById(input.sellerId);
      if (!sellerExists) throw new NotFoundException('Seller not found');
    }

    const category = await this.categoryModel.findById(input.categoryId);
    if (!category || !category.isActive)
      throw new NotFoundException('Category not found');

    let slug = this.slugService.slugify(input.name);
    const slugExists = await this.productModel.findOne({ slug });
    if (slugExists)
      slug = this.slugService.uniqueSlug(
        input.name,
        Date.now().toString().slice(-5),
      );

    const product = await this.productModel.create({
      sellerId: role === 'admin' ? input.sellerId || null : seller?._id,
      categoryId: input.categoryId,
      name: input.name,
      slug,
      description: input.description,
      basePrice: input.basePrice,
      status: input.status,
      attributes: input.attributes,
    });

    return product;
  }

  // ── Upload images ─────────────────────────────────────────────────────────────
  async uploadProductImages(
    userId: string,
    role: string,
    productId: string,
    buffers: Buffer[],
  ) {
    const seller = await this.getApprovedSeller(userId, role);
    const product = await this.assertProductOwner(
      productId,
      seller?._id?.toString() ?? null,
      role,
    );

    if (product.images.length + buffers.length > 8)
      throw new BadRequestException(
        `Cannot exceed 8 images. Currently has ${product.images.length}.`,
      );

    const urls = await Promise.all(
      buffers.map((b) => this.cloudinaryService.uploadFile(b, 'products')),
    );

    product.images.push(...urls.map((url) => url.secure_url));
    await product.save();
    return { images: product.images };
  }

  // ── Delete single image ───────────────────────────────────────────────────────
  async deleteProductImage(
    userId: string,
    role: string,
    productId: string,
    imageUrl: string,
  ) {
    const seller = await this.getApprovedSeller(userId, role);
    const product = await this.assertProductOwner(
      productId,
      seller?._id?.toString() ?? null,
      role,
    );

    if (!product.images.includes(imageUrl))
      throw new NotFoundException('Image not found on this product');

    await this.cloudinaryService.deleteFile(imageUrl).catch(() => null);
    product.images = product.images.filter((img) => img !== imageUrl);
    await product.save();
    return { images: product.images };
  }

  // ── Update ────────────────────────────────────────────────────────────────────
  async updateProduct(
    userId: string,
    role: string,
    productId: string,
    input: UpdateProductDto,
  ) {
    const seller = await this.getApprovedSeller(userId, role);
    const product = await this.assertProductOwner(
      productId,
      seller?._id?.toString() ?? null,
      role,
    );

    if (input.categoryId) {
      const category = await this.categoryModel.findById(input.categoryId);
      if (!category || !category.isActive)
        throw new NotFoundException('Category not found');
      product.categoryId = category._id;
    }

    if (role === 'admin' && input.sellerId) {
      const sellerExists = await this.sellerModel.findById(input.sellerId);
      if (!sellerExists) throw new NotFoundException('Seller not found');
      product.sellerId = sellerExists._id;
    }

    if (input.name && input.name !== product.name) {
      let slug = this.slugService.slugify(input.name);
      const slugExists = await this.productModel.findOne({
        slug,
        _id: { $ne: product._id },
      });
      if (slugExists)
        slug = this.slugService.uniqueSlug(
          input.name,
          Date.now().toString().slice(-5),
        );
      product.name = input.name;
      product.slug = slug;
    }

    if (input.description !== undefined)
      product.description = input.description;
    if (input.basePrice !== undefined) product.basePrice = input.basePrice;
    if (input.status !== undefined) product.status = input.status;
    if (input.attributes !== undefined) product.attributes = input.attributes;

    await product.save();
    return product;
  }

  // ── Archive (soft delete) ─────────────────────────────────────────────────────
  async archiveProduct(userId: string, role: string, productId: string) {
    const seller = await this.getApprovedSeller(userId, role);
    const product = await this.assertProductOwner(
      productId,
      seller?._id?.toString() ?? null,
      role,
    );
    product.status = 'archived';
    await product.save();
    return product;
  }

  // ── Get single (public) ───────────────────────────────────────────────────────
  async getProductBySlug(slug: string) {
    const product = await this.productModel
      .findOne({ slug, status: 'active' })
      .populate('categoryId', 'name slug')
      .populate('sellerId', 'storeName storeSlug logo rating');

    if (!product) throw new NotFoundException('Product not found');

    const variants = await this.inventoryModel
      .find({ productId: product._id })
      .select('size color price stock reserved sku');

    return { product, variants };
  }

  // ── List (public) ─────────────────────────────────────────────────────────────
  async listProducts(query: ListProductsQueryDto) {
    const { skip, limit, page } = this.paginationService.getPagination(
      query.page,
      query.limit,
    );

    // Base filter — public sees only active
    const filter: Record<string, unknown> = { status: 'active' };

    if (query.category) filter.categoryId = query.category;
    if (query.seller) filter.sellerId = query.seller;
    if (query.rating) filter.rating = { $gte: query.rating };
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.basePrice = {
        ...(query.minPrice !== undefined && { $gte: query.minPrice }),
        ...(query.maxPrice !== undefined && { $lte: query.maxPrice }),
      };
    }
    if (query.search) filter.$text = { $search: query.search };

    // If filtering by size/color we need to join through Inventory
    if (query.size || query.color) {
      const inventoryFilter: Record<string, unknown> = {};
      if (query.size)
        inventoryFilter.size = { $regex: query.size, $options: 'i' };
      if (query.color)
        inventoryFilter.color = { $regex: query.color, $options: 'i' };
      const matchingInventory = await this.inventoryModel
        .find(inventoryFilter)
        .distinct('productId');
      filter._id = { $in: matchingInventory };
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      price_asc: { basePrice: 1 },
      price_desc: { basePrice: -1 },
      rating: { rating: -1 },
    };
    const sort = sortMap[query.sort as string] ?? sortMap.newest;

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('categoryId', 'name slug')
        .populate('sellerId', 'storeName storeSlug logo')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      this.productModel.countDocuments(filter),
    ]);

    return {
      products,
      pagination: this.paginationService.buildPaginationMeta(
        total,
        page,
        limit,
      ),
    };
  }

  // ── Seller: list own products ─────────────────────────────────────────────────
  async listMyProducts(
    userId: string,
    role: string,
    query: ListProductsQueryDto,
  ) {
    const seller = await this.sellerModel.findOne({ userId });
    if (!seller && role !== 'admin')
      throw new NotFoundException('Seller profile not found');

    const { skip, limit, page } = this.paginationService.getPagination(
      query.page,
      query.limit,
    );

    const filter: Record<string, unknown> = seller
      ? { sellerId: seller._id }
      : { sellerId: null };
    if (query.status) filter.status = query.status;
    if (query.search) filter.$text = { $search: query.search };

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('categoryId', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.productModel.countDocuments(filter),
    ]);

    return {
      products,
      pagination: this.paginationService.buildPaginationMeta(
        total,
        page,
        limit,
      ),
    };
  }

  // ── Admin: list all products ──────────────────────────────────────────────────
  async adminListProducts(query: ListProductsQueryDto) {
    const { skip, limit, page } = this.paginationService.getPagination(
      query.page,
      query.limit,
    );

    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.seller) filter.sellerId = query.seller;
    if (query.category) filter.categoryId = query.category;
    if (query.search) filter.$text = { $search: query.search };

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('categoryId', 'name slug')
        .populate('sellerId', 'storeName storeSlug status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.productModel.countDocuments(filter),
    ]);

    return {
      products,
      pagination: this.paginationService.buildPaginationMeta(
        total,
        page,
        limit,
      ),
    };
  }

  // ── Admin: force archive ──────────────────────────────────────────────────────
  async adminArchiveProduct(productId: string) {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('Product not found');
    product.status = 'archived';
    await product.save();
    return product;
  }
}
