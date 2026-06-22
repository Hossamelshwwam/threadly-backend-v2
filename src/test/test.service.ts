import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from 'src/user/schema/user.schema';
import { UserService } from 'src/user/user.service';

@Injectable()
export class TestService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    private readonly userService: UserService,
  ) {}
  test() {
    return { message: 'hello from testing' };
  }

  async users() {
    return await this.userModel.find();
  }
}
