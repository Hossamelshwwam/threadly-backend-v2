import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Connection, Types } from 'mongoose';
import { OrderDocument } from './schema/order.schema';
import { UserDocument } from '../user/schema/user.schema';
import { SellerDocument } from '../seller/schema/seller.schema';
import { ConfigService } from '@nestjs/config';
import { PaginationService } from '../common/services/pagination.service';
import { CartService } from '../cart/cart.service'; // Adjust relative to directory blueprint
import {
  AdminUpdateOrderDto,
  ListOrdersQueryDto,
  PlaceOrderDto,
  UpdateOrderItemStatusDto,
} from './dto/order.dto';
import {
  OrderItem,
  OrderItemDocument,
} from '../order-item/schema/order-item.schema';
import { Address } from '../user/schema/address.schema';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
};

@Injectable()
export class OrderService {
  constructor(
    @InjectModel('Order') private readonly orderModel: Model<OrderDocument>,
    @InjectModel('OrderItem')
    private readonly orderItemModel: Model<OrderItemDocument>,
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    @InjectModel('Cart') private readonly cartModel: Model<any>,
    @InjectModel('Inventory') private readonly inventoryModel: Model<any>,
    @InjectModel('Product') private readonly productModel: Model<any>,
    @InjectModel('Seller') private readonly sellerModel: Model<SellerDocument>,
    @InjectModel('Payout') private readonly payoutModel: Model<any>,
    @InjectModel('Review') private readonly reviewModel: Model<any>,
    @InjectConnection() private readonly connection: Connection,
    private readonly paginationService: PaginationService,
    private readonly configService: ConfigService,
    private readonly cartService: CartService,
  ) {}

  // ── Helper: Generate order entry identification sequence ──────────────────────
  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = await this.orderModel.countDocuments();
    return `TH-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }

  // ── Sync parent order status ─────────────────────────────────────────────────
  private async syncOrderStatus(
    orderId: string,
    session: mongoose.ClientSession,
  ) {
    const order = await this.orderModel.findById(orderId).session(session);
    if (!order) return;

    const items = await this.orderItemModel
      .find({ orderId: new Types.ObjectId(orderId) })
      .session(session);
    const statuses = items.map((i) => i.status);

    let newStatus: string = order.status;

    const activeStatuses = statuses.filter((s) => s !== 'cancelled');

    if (activeStatuses.length === 0 && statuses.length > 0) {
      // Every single item was cancelled
      newStatus = 'cancelled';
    } else if (activeStatuses.every((s) => s === 'delivered')) {
      // All non-cancelled items are delivered
      newStatus = 'delivered';
    } else if (
      activeStatuses.every((s) => s === 'shipped' || s === 'delivered')
    ) {
      // All non-cancelled items are at least shipped
      newStatus = 'shipped';
    } else if (
      activeStatuses.some((s) => s === 'shipped' || s === 'delivered')
    ) {
      newStatus = 'partially_shipped';
    } else if (activeStatuses.some((s) => s === 'processing')) {
      newStatus = 'confirmed';
    } else {
      newStatus = 'pending'; // Fallback if everything active is pending
    }

    if (newStatus !== order.status) {
      order.status = newStatus as any;
      await order.save({ session });
    }
  }

  // ── Check and update payment status ──────────────────────────────────────────
  private async checkAndUpdatePaymentStatus(
    orderId: string,
    session: mongoose.ClientSession,
  ) {
    const order = await this.orderModel.findById(orderId).session(session);
    if (
      order &&
      order.paymentMethod === 'cash_on_delivery' &&
      order.paymentStatus === 'unpaid'
    ) {
      const allItems = await this.orderItemModel
        .find({ orderId: order._id })
        .session(session);
      const activeItems = allItems.filter((i) => i.status !== 'cancelled');
      const allActiveDelivered =
        activeItems.length > 0 &&
        activeItems.every((i) => i.status === 'delivered');

      if (allActiveDelivered) {
        order.paymentStatus = 'paid';
        await order.save({ session });
      }
    }
  }

  // ── Handle item cancellation side effects ──────────────────────────────────────
  private async handleCancellation(
    item: OrderItemDocument,
    session: mongoose.ClientSession,
  ) {
    const order = await this.orderModel.findById(item.orderId).session(session);
    if (!order) return;

    // 1. Deduct the cancelled item's total from the order's financial records
    order.subtotal -= item.total;
    order.total -= item.total; // You might also need to adjust shipping fees here if they are dynamic

    // 2. Prevent negative totals just in case of rounding errors
    if (order.subtotal <= 0) order.subtotal = 0;
    if (order.total <= 0) order.total = 0;

    // 3. Handle Payment Status depending on the payment method
    if (order.paymentMethod === 'cash_on_delivery') {
      // If COD, we just adjusted the total. The driver will collect the new, lower amount.
      if (order.total === 0) {
        order.paymentStatus = 'unpaid'; // Or leave as unpaid since it's cancelled
      }
    } else if (order.paymentStatus === 'paid') {
      // If paid via Credit Card, you owe the customer a refund for this specific item!
      // TODO: Trigger your payment gateway API here to issue a partial refund for `item.total`

      // If all items are cancelled, mark as fully refunded. Otherwise, you might want a 'partially_refunded' state.
      const allItems = await this.orderItemModel
        .find({ orderId: order._id })
        .session(session);
      const allCancelled = allItems.every((i) => i.status === 'cancelled');

      if (allCancelled) {
        order.paymentStatus = 'unpaid';
      }
    }

    await order.save({ session });

    // 4. (Optional) Return inventory stock if you reserved it previously
    await this.inventoryModel.findByIdAndUpdate(
      item.inventoryId,
      { $inc: { stock: item.quantity, reserved: -item.quantity } },
      { session },
    );
  }

  // ── Handle item delivery side effects ─────────────────────────────────────────
  private async handleDelivery(
    item: OrderItemDocument,
    session: mongoose.ClientSession,
  ) {
    await this.inventoryModel.findByIdAndUpdate(
      item.inventoryId,
      { $inc: { stock: -item.quantity, reserved: -item.quantity } },
      { session },
    );

    if (item.sellerId) {
      await this.sellerModel.findByIdAndUpdate(
        item.sellerId,
        { $inc: { totalSales: item.quantity } },
        { session },
      );

      const platformFeePercent =
        (this.configService.get<number>('PLATFORM_FEE_PERCENT') ?? 10) / 100;
      const platformFee = parseFloat(
        (item.total * platformFeePercent).toFixed(2),
      );
      const netAmount = parseFloat((item.total - platformFee).toFixed(2));

      await this.payoutModel.create(
        [
          {
            sellerId: item.sellerId,
            orderId: item.orderId,
            amount: item.total,
            platformFee,
            netAmount,
            status: 'pending',
          },
        ],
        { session, ordered: true },
      );
    }

    await this.checkAndUpdatePaymentStatus(item.orderId.toString(), session);
  }

  // ── Apply item status transition ──────────────────────────────────────────────
  private async applyItemStatusTransition(
    item: OrderItemDocument,
    input: UpdateOrderItemStatusDto,
    session: mongoose.ClientSession,
  ) {
    const allowed = STATUS_TRANSITIONS[item.status] ?? [];
    if (!allowed.includes(input.status) && input.status !== item.status) {
      throw new BadRequestException(
        `Cannot transition from "${item.status}" to "${input.status}"`,
      );
    }

    const previousStatus = item.status;
    item.status = input.status;
    if (input.trackingNumber) item.trackingNumber = input.trackingNumber;
    await item.save({ session });

    if (input.status === 'cancelled') {
      await this.inventoryModel.findByIdAndUpdate(
        item.inventoryId,
        { $inc: { reserved: -item.quantity } },
        { session },
      );

      await this.handleCancellation(item, session);
    }

    if (input.status === 'delivered' && previousStatus !== 'delivered') {
      await this.handleDelivery(item, session);
    }

    await this.syncOrderStatus(item.orderId.toString(), session);
  }

  // ── Resolve shipping address ───────────────────────────────────────────────
  private async resolveShippingAddress(
    userId: string,
    addressId: string,
    session: mongoose.ClientSession,
  ) {
    const user = await this.userModel
      .findById(userId)
      .select('name phone addresses')
      .session(session);
    if (!user) throw new NotFoundException('User not found');

    const existingAddress = user.addresses.find(
      (a: Address) => a._id?.toString() === addressId,
    );

    if (!existingAddress) throw new NotFoundException('Address not found');

    return {
      fullName: user.name,
      street: existingAddress.street,
      city: existingAddress.city,
      state: existingAddress.state,
      postalCode: existingAddress.postalCode,
      country: existingAddress.country,
      phonenumber: existingAddress.phonenumber,
    };
  }

  // ── Place order ───────────────────────────────────────────────────────────────
  async placeOrder(userId: string, input: PlaceOrderDto) {
    const cart = await this.cartModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('items.inventoryId');
    if (!cart || cart.items.length === 0)
      throw new BadRequestException('Your cart is empty');

    const orderNumber = await this.generateOrderNumber();
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const shippingAddress = await this.resolveShippingAddress(
        userId,
        input.addressId,
        session,
      );
      const orderItemsData: any[] = [];
      let subtotal = 0;

      for (const item of cart.items) {
        const variant = await this.inventoryModel
          .findById(item.inventoryId._id)
          .session(session);
        if (!variant) throw new NotFoundException('Variant not found');

        const available = variant.stock - variant.reserved;
        if (available < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for variant ${variant.sku}. Only ${available} unit(s) left.`,
          );
        }

        const product = await this.productModel
          .findById(item.productId)
          .session(session);
        if (!product || product.status !== 'active') {
          throw new BadRequestException(
            `Product ${item.productId} is no longer available`,
          );
        }

        variant.reserved += item.quantity;
        await variant.save({ session });

        const itemTotal = item.priceSnapshot * item.quantity;
        subtotal += itemTotal;

        orderItemsData.push({
          productId: product._id,
          sellerId: product?.sellerId ?? null,
          inventoryId: variant._id,
          productName: product.name,
          productImage: product.images[0],
          size: variant.size,
          color: variant.color,
          quantity: item.quantity,
          unitPrice: item.priceSnapshot,
          total: itemTotal,
        });
      }

      const [order] = await this.orderModel.create(
        [
          {
            buyerId: userId,
            orderNumber,
            shippingAddress,
            subtotal,
            total: subtotal,
            paymentMethod: input.paymentMethod,
            paymentStatus:
              input.paymentMethod === 'cash_on_delivery' ? 'unpaid' : 'paid',
            status: 'pending',
          },
        ],
        { session, ordered: true },
      );

      const data: OrderItem[] = orderItemsData.map((item) => ({
        ...item,
        orderId: order._id,
        status: 'pending',
      }));
      const orderItems = await this.orderItemModel.create(data, {
        session,
        ordered: true,
      });

      await session.commitTransaction();

      await this.cartService.clearCart(userId).catch(() => null);

      return { order, orderItems };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }

  // ── Get order detail (buyer) ──────────────────────────────────────────────────
  async getOrderById(userId: string, orderId: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId.toString() !== userId)
      throw new ForbiddenException('Forbidden');

    const items = await this.orderItemModel
      .find({ orderId: order._id })
      .populate('productId', 'name slug images')
      .populate('sellerId', 'storeName storeSlug');

    return { order, items };
  }

  // ── List buyer orders ─────────────────────────────────────────────────────────
  async listMyOrders(userId: string, query: ListOrdersQueryDto) {
    const { skip, limit, page } = this.paginationService.getPagination(
      query.page,
      query.limit,
    );

    const filter: Record<string, unknown> = { buyerId: userId };
    if (query.status) filter.status = query.status;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.from || query.to) {
      filter.createdAt = {
        ...(query.from && { $gte: new Date(query.from) }),
        ...(query.to && { $lte: new Date(query.to) }),
      };
    }

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.orderModel.countDocuments(filter),
    ]);

    const ordersWithCounts = await Promise.all(
      orders.map(async (order) => {
        const itemCount = await this.orderItemModel.countDocuments({
          orderId: order._id,
        });
        return Object.assign(order.toObject(), { itemCount });
      }),
    );

    return {
      orders: ordersWithCounts,
      pagination: this.paginationService.buildPaginationMeta(
        total,
        page,
        limit,
      ),
    };
  }

  // ── Cancel order item (buyer) ─────────────────────────────────────────────────
  async cancelOrderItem(userId: string, itemId: string) {
    const item = await this.orderItemModel.findById(itemId);
    if (!item) throw new NotFoundException('Order item not found');

    const order = await this.orderModel.findById(item.orderId);
    if (!order || order.buyerId.toString() !== userId)
      throw new ForbiddenException('Forbidden');

    if (!['pending', 'processing'].includes(item.status)) {
      throw new BadRequestException(
        `Cannot cancel an item with status: ${item.status}`,
      );
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      await this.inventoryModel.findByIdAndUpdate(
        item.inventoryId,
        { $inc: { reserved: -item.quantity } },
        { session },
      );

      item.status = 'cancelled';
      await item.save({ session });

      const allItems = await this.orderItemModel
        .find({ orderId: order._id })
        .session(session);
      const allCancelled = allItems.every((i) => i.status === 'cancelled');
      if (allCancelled) {
        order.status = 'cancelled';
        await order.save({ session });
      }

      await session.commitTransaction();
      return item;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }

  // ── Get pending reviews (buyer) ───────────────────────────────────────────────
  async getPendingReviews(userId: string) {
    const orders = await this.orderModel.find({ buyerId: userId });
    const orderIds = orders.map((o) => o._id);

    const deliveredItems = await this.orderItemModel
      .find({ orderId: { $in: orderIds }, status: 'delivered' })
      .populate('productId', 'name slug images');

    const reviewedItemIds = await this.reviewModel
      .find({ buyerId: userId })
      .distinct('orderItemId');
    const reviewedStrings = reviewedItemIds.map((id) => id.toString());

    return deliveredItems.filter(
      (item) => !reviewedStrings.includes(item._id.toString()),
    );
  }

  // ── Seller: list own order items ──────────────────────────────────────────────
  async listSellerOrderItems(userId: string, query: ListOrdersQueryDto) {
    const seller = await this.sellerModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!seller) throw new NotFoundException('Seller profile not found');

    const { skip, limit, page } = this.paginationService.getPagination(
      query.page,
      query.limit,
    );

    const filter: Record<string, unknown> = { sellerId: seller._id };
    if (query.status) filter.status = query.status;
    if (query.from || query.to) {
      filter.createdAt = {
        ...(query.from && { $gte: new Date(query.from) }),
        ...(query.to && { $lte: new Date(query.to) }),
      };
    }

    const [items, total] = await Promise.all([
      this.orderItemModel
        .find(filter)
        .populate(
          'orderId',
          'orderNumber shippingAddress paymentMethod paymentStatus createdAt',
        )
        .populate('productId', 'name slug images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.orderItemModel.countDocuments(filter),
    ]);

    return {
      items,
      pagination: this.paginationService.buildPaginationMeta(
        total,
        page,
        limit,
      ),
    };
  }

  async sellerGetOrderItem(itemId: string, userId: string) {
    const seller = await this.sellerModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!seller) throw new NotFoundException('Seller not found');

    const item = await this.orderItemModel
      .findById({ _id: itemId, sellerId: seller._id })
      .populate(
        'orderId',
        'orderNumber shippingAddress paymentMethod paymentStatus createdAt',
      )
      .populate('productId', 'name slug images');
    return item;
  }

  // ── Seller: update order item status ─────────────────────────────────────────
  async updateOrderItemStatus(
    userId: string,
    itemId: string,
    input: UpdateOrderItemStatusDto,
  ) {
    const seller = await this.sellerModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!seller) throw new NotFoundException('Seller profile not found');

    const item = await this.orderItemModel.findById(itemId);
    if (!item) throw new NotFoundException('Order item not found');
    if (item.sellerId?.toString() !== seller._id.toString())
      throw new ForbiddenException('Forbidden');

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      await this.applyItemStatusTransition(item, input, session);
      await session.commitTransaction();
      return item;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }

  // ── Admin: update order item status ──────────────────────────────────────────
  async adminUpdateOrderItemStatus(
    itemId: string,
    input: UpdateOrderItemStatusDto,
  ) {
    const item = await this.orderItemModel.findById(itemId);
    if (!item) throw new NotFoundException('Order item not found');

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      await this.applyItemStatusTransition(item, input, session);
      await session.commitTransaction();
      return item;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }

  // ── Admin: list all orders ────────────────────────────────────────────────────
  async adminListOrders(query: ListOrdersQueryDto) {
    const { skip, limit, page } = this.paginationService.getPagination(
      query.page,
      query.limit,
    );

    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.from || query.to) {
      filter.createdAt = {
        ...(query.from && { $gte: new Date(query.from) }),
        ...(query.to && { $lte: new Date(query.to) }),
      };
    }

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('buyerId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: this.paginationService.buildPaginationMeta(
        total,
        page,
        limit,
      ),
    };
  }

  // ── Admin: get full order detail ──────────────────────────────────────────────
  async adminGetOrder(orderId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('buyerId', 'name email phone');
    if (!order) throw new NotFoundException('Order not found');

    const items = await this.orderItemModel
      .find({ orderId: order._id })
      .populate('productId', 'name slug images')
      .populate('sellerId', 'storeName storeSlug logo');

    return { order, items };
  }

  // ── Admin: update order ───────────────────────────────────────────────────────
  async adminUpdateOrder(orderId: string, input: AdminUpdateOrderDto) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    if (input.paymentStatus) order.paymentStatus = input.paymentStatus;
    if (input.status) order.status = input.status;

    await order.save();
    return order;
  }
}
