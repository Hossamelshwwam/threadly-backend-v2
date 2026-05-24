import { Injectable } from '@nestjs/common';
import { OrderDocument } from './schema/order.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel('Order') private readonly orderModel: Model<OrderDocument>,
  ) {}

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = await this.orderModel.countDocuments();
    return `TH-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
}
