import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderSchema } from './schema/order.schema';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { UserSchema } from 'src/user/schema/user.schema';
import { CartSchema } from 'src/cart/schema/cart.schema';
import { InventorySchema } from 'src/inventory/schema/inventory.schema';
import { OrderItemSchema } from 'src/order-item/schema/order-item.schema';
import { PayoutSchema } from 'src/payout/schema/payout.schema';
import { ProductSchema } from 'src/product/schema/product.schema';
import { ReviewSchema } from 'src/review/schema/review.schema';
import { SellerSchema } from 'src/seller/schema/seller.schema';
import { CartModule } from 'src/cart/cart.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema },
      { name: 'User', schema: UserSchema },
      { name: 'OrderItem', schema: OrderItemSchema },
      { name: 'Cart', schema: CartSchema },
      { name: 'Inventory', schema: InventorySchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'Seller', schema: SellerSchema },
      { name: 'Review', schema: ReviewSchema },
      { name: 'Payout', schema: PayoutSchema },
    ]),
    CartModule,
  ],

  providers: [OrderService],

  controllers: [OrderController],
})
export class OrderModule {}
