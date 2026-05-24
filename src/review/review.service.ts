import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types } from 'mongoose';
import { ReviewDocument } from './schema/review.schema';
import { CreateReviewDto, ListReviewsQueryDto } from './dto/review.dto';
import { PaginationService } from 'src/common/services/pagination.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { OrderItemDocument } from 'src/order-item/schema/order-item.schema';
import { ProductDocument } from 'src/product/schema/product.schema';
import { SellerDocument } from 'src/seller/schema/seller.schema';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel('Review') private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel('OrderItem')
    private readonly orderItemModel: Model<OrderItemDocument>,
    @InjectModel('Product')
    private readonly productModel: Model<ProductDocument>,
    @InjectModel('Seller')
    private readonly sellerProfileModel: Model<SellerDocument>,
    private readonly paginationService: PaginationService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ── Recalculate product rating helper ────────────────────────────────────────
  private async recalculateProductRating(productId: string): Promise<void> {
    const stats = await this.reviewModel.aggregate([
      { $match: { productId: new Types.ObjectId(productId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    const avg = stats[0]?.avgRating ?? 0;
    const count = stats[0]?.count ?? 0;

    await this.productModel.findByIdAndUpdate(productId, {
      rating: Math.round(avg * 10) / 10,
      reviewCount: count,
    });
  }

  // ── Create review ─────────────────────────────────────────────────────────────
  async createReview(
    userId: string,
    input: CreateReviewDto,
    imageBuffers: Buffer[],
  ) {
    const orderItem = await this.orderItemModel
      .findById(input.orderItemId)
      .populate('orderId');
    if (!orderItem) throw new NotFoundException('Order item not found');

    if (orderItem.orderId['buyerId'].toString() !== userId) {
      throw new ForbiddenException('Forbidden');
    }

    if (orderItem.status !== 'delivered') {
      throw new BadRequestException(
        'You can only review items that have been delivered',
      );
    }

    const existing = await this.reviewModel.findOne({
      orderItemId: input.orderItemId,
    });
    if (existing)
      throw new ConflictException('You have already reviewed this item');

    let images: string[] = [];
    if (imageBuffers.length > 0) {
      const uploadPromises = imageBuffers.map((b) =>
        this.cloudinaryService.uploadFile(b, 'reviews'),
      );
      const uploadedFiles = await Promise.all(uploadPromises);
      images = uploadedFiles.map((file) => file.secure_url);
    }

    const review = await this.reviewModel.create({
      productId: orderItem.productId,
      buyerId: userId,
      orderItemId: input.orderItemId,
      rating: input.rating,
      comment: input.comment,
      images,
      verified: true,
    });

    await this.recalculateProductRating(orderItem.productId.toString());
    return review;
  }

  // ── List reviews for a product ────────────────────────────────────────────────
  async listProductReviews(productId: string, query: ListReviewsQueryDto) {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    const { skip, limit, page } = this.paginationService.getPagination(
      query.page,
      query.limit,
    );

    const filter: Record<string, unknown> = { productId };
    if (query.rating) filter.rating = query.rating;

    const sortMap: Record<string, { [key: string]: SortOrder }> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      rating_asc: { rating: 1 },
      rating_desc: { rating: -1 },
    };
    const sort = sortMap[query.sort];

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('buyerId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      this.reviewModel.countDocuments(filter),
    ]);

    const breakdown = await this.reviewModel.aggregate([
      { $match: { productId: new Types.ObjectId(productId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    const ratingBreakdown: Record<number, number> = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };
    for (const b of breakdown) {
      ratingBreakdown[b._id] = b.count;
    }

    return {
      reviews,
      pagination: this.paginationService.buildPaginationMeta(
        total,
        page,
        limit,
      ),
      ratingBreakdown,
      averageRating: product.rating,
      totalReviews: product.reviewCount,
    };
  }

  // ── Get single review ─────────────────────────────────────────────────────────
  async getReview(reviewId: string) {
    const review = await this.reviewModel
      .findById(reviewId)
      .populate('buyerId', 'name')
      .populate('productId', 'name slug images');
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  // ── Delete own review ─────────────────────────────────────────────────────────
  async deleteReview(userId: string, reviewId: string) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');
    if (review.buyerId.toString() !== userId)
      throw new ForbiddenException('Forbidden');

    const productId = review.productId.toString();
    await review.deleteOne();
    await this.recalculateProductRating(productId);
  }

  // ── Seller: list reviews on own products ──────────────────────────────────────
  async listSellerReviews(userId: string, query: ListReviewsQueryDto) {
    const seller = await this.sellerProfileModel.findOne({ userId });
    if (!seller) throw new NotFoundException('Seller profile not found');

    const { skip, limit, page } = this.paginationService.getPagination(
      query.page,
      query.limit,
    );

    const sellerProducts = await this.productModel
      .find({ sellerId: seller._id })
      .distinct('_id');

    const filter: Record<string, unknown> = {
      productId: { $in: sellerProducts },
    };
    if (query.rating) filter.rating = query.rating;

    const sortMap: Record<string, { [key: string]: SortOrder }> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      rating_asc: { rating: 1 },
      rating_desc: { rating: -1 },
    };

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('buyerId', 'name')
        .populate('productId', 'name slug images')
        .sort(sortMap[query.sort])
        .skip(skip)
        .limit(limit),
      this.reviewModel.countDocuments(filter),
    ]);

    return {
      reviews,
      pagination: this.paginationService.buildPaginationMeta(
        total,
        page,
        limit,
      ),
    };
  }

  // ── Admin: delete any review ──────────────────────────────────────────────────
  async adminDeleteReview(reviewId: string) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');

    const productId = review.productId.toString();
    await review.deleteOne();
    await this.recalculateProductRating(productId);
  }
}
