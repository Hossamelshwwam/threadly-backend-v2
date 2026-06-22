import { Module } from '@nestjs/common';
import { PayoutController } from './payout.controller';
import { PayoutService } from './payout.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SellerSchema } from '../seller/schema/seller.schema';
import { PayoutSchema } from './schema/payout.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Payout', schema: PayoutSchema },
      { name: 'Seller', schema: SellerSchema },
    ]),
  ],
  controllers: [PayoutController],
  providers: [PayoutService],
  exports: [PayoutService],
})
export class PayoutModule {}
