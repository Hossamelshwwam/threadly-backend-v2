import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { AuthRoles } from '../common/decorator/auth-roles.decorator';
import { CurrentUser } from '../common/decorator/current-user.decorator';
import type { AuthUser } from '../common/types/user.type';
import { CreateReviewDto, ListReviewsQueryDto } from './dto/review.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // ── Public ────────────────────────────────────────────────────────────────────
  @Get('products/:productId')
  async listProductReviews(
    @Param('productId') productId: string,
    @Query() query: ListReviewsQueryDto,
  ) {
    const data = await this.reviewService.listProductReviews(productId, query);
    return {
      success: true,
      data: data.data,
      message: 'Reviews fetched successfully',
      pagination: data.pagination,
    };
  }

  // ── Seller ────────────────────────────────────────────────────────────────────
  @AuthRoles('seller')
  @Get('seller')
  @ApiBearerAuth()
  async listSellerReviews(
    @CurrentUser() user: AuthUser,
    @Query() query: ListReviewsQueryDto,
  ) {
    const data = await this.reviewService.listSellerReviews(user.userId, query);
    return {
      success: true,
      data: data.reviews,
      pagination: data.pagination,
      message: 'Reviews fetched successfully',
    };
  }

  @Get(':id')
  async getReview(@Param('id') id: string) {
    const data = await this.reviewService.getReview(id);
    return { success: true, data, message: 'Review fetched successfully' };
  }

  // ── Buyer ─────────────────────────────────────────────────────────────────────
  @AuthRoles()
  @Post()
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderItemId: { type: 'string' },
        rating: { type: 'integer', minimum: 1, maximum: 5 },
        comment: { type: 'string' },
        images: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
      required: ['orderItemId', 'rating', 'comment'],
    },
  })
  async createReview(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateReviewDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const imageBuffers = files ? files.map((file) => file.buffer) : [];
    const data = await this.reviewService.createReview(
      user.userId,
      body,
      imageBuffers,
    );
    return { success: true, data, message: 'Review submitted successfully' };
  }

  @AuthRoles()
  @Delete(':id')
  @ApiBearerAuth()
  async deleteReview(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.reviewService.deleteReview(user.userId, id);
    return {
      success: true,
      data: null,
      message: 'Review deleted successfully',
    };
  }

  // ── Admin ─────────────────────────────────────────────────────────────────────
  @AuthRoles('admin')
  @Delete('admin/:id')
  @ApiBearerAuth()
  async adminDeleteReview(@Param('id') id: string) {
    await this.reviewService.adminDeleteReview(id);
    return {
      success: true,
      data: null,
      message: 'Review deleted by admin successfully',
    };
  }
}
