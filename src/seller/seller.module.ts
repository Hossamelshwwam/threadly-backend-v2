import { Module } from '@nestjs/common';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/user/schema/user.schema';
import { SellerSchema } from './schema/seller.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Seller', schema: SellerSchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],
  controllers: [SellerController],
  providers: [SellerService],
})
export class SellerModule {}
