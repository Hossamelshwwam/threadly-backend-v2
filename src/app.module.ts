import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
// import { OrderModule } from './order/order.module';
// import { SellerModule } from './seller/seller.module';
// import { PayoutModule } from './payout/payout.module';
// import { ProductModule } from './product/product.module';
// import { OrderItemModule } from './order-item/order-item.module';
// import { CategoryModule } from './category/category.module';
// import { InventoryModule } from './inventory/inventory.module';
// import { CartModule } from './cart/cart.module';
// import { ReviewModule } from './review/review.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { SharedModule } from './common/module/shared.module';
import { TestModule } from './test/test.module';

@Module({
  imports: [
    // UserModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
        dbName: config.get<string>('MONGO_DB_NAME'),
      }),
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('SMTP_HOST'),
          port: config.get<number>('SMTP_PORT'),
          auth: {
            user: config.get<string>('SMTP_USER'),
            pass: config.get<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: config.get<string>('EMAIL_FROM'),
        },
        template: {
          adapter: new HandlebarsAdapter(),
        },
      }),
    }),
    // AuthModule,
    // OrderModule,
    // SellerModule,
    // PayoutModule,
    // ProductModule,
    // OrderItemModule,
    // CategoryModule,
    // InventoryModule,
    // CartModule,
    CloudinaryModule,
    // ReviewModule,
    SharedModule,
    TestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
