import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { TestService } from './test.service';
import { UserSchema } from 'src/user/schema/user.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  controllers: [TestController],
  providers: [TestService],
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])],
})
export class TestModule {}
