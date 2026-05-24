import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductSchema } from './schema/product.schema';
import { InventorySchema } from 'src/inventory/schema/inventory.schema';
import { CategorySchema } from 'src/category/schema/category.schema';
import { SellerSchema } from 'src/seller/schema/seller.schema';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Product', schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: 'Seller', schema: SellerSchema }]),
    MongooseModule.forFeature([{ name: 'Inventory', schema: InventorySchema }]),
    MongooseModule.forFeature([{ name: 'Category', schema: CategorySchema }]),
    CloudinaryModule,
  ],
  providers: [ProductService],
  controllers: [ProductController],
})
export class ProductModule {}
