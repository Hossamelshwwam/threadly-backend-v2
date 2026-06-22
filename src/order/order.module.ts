import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderSchema } from './schema/order.schema';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { UserSchema } from '../user/schema/user.schema';
import { CartSchema } from '../cart/schema/cart.schema';
import { InventorySchema } from '../inventory/schema/inventory.schema';
import { OrderItemSchema } from '../order-item/schema/order-item.schema';
import { PayoutSchema } from '../payout/schema/payout.schema';
import { ProductSchema } from '../product/schema/product.schema';
import { ReviewSchema } from '../review/schema/review.schema';
import { SellerSchema } from '../seller/schema/seller.schema';
import { CartModule } from '../cart/cart.module';

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
