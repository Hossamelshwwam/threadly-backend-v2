import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { ReviewSchema } from './schema/review.schema';
import { OrderItemSchema } from '../order-item/schema/order-item.schema';
import { ProductSchema } from '../product/schema/product.schema';
import { SellerSchema } from '../seller/schema/seller.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Review', schema: ReviewSchema },
      { name: 'OrderItem', schema: OrderItemSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'Seller', schema: SellerSchema },
    ]),
  ],
  providers: [ReviewService],
  controllers: [ReviewController],
})
export class ReviewModule {}
