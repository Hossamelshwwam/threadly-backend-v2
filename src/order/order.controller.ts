import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AuthRoles } from 'src/common/decorator/auth-roles.decorator';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import type { AuthUser } from 'src/common/types/user.type';
import {
  AdminUpdateOrderDto,
  ListOrdersQueryDto,
  PlaceOrderDto,
  UpdateOrderItemStatusDto,
} from './dto/order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ── Buyer ─────────────────────────────────────────────────────────────────────
  @ApiBearerAuth()
  @Post()
  @UseGuards(AuthGuard)
  async placeOrder(@CurrentUser() user: AuthUser, @Body() body: PlaceOrderDto) {
    const data = await this.orderService.placeOrder(user.userId, body);
    return { success: true, data, message: 'Order placed successfully' };
  }

  @ApiBearerAuth()
  @Get()
  @UseGuards(AuthGuard)
  async listMyOrders(
    @CurrentUser() user: AuthUser,
    @Query() query: ListOrdersQueryDto,
  ) {
    const data = await this.orderService.listMyOrders(user.userId, query);
    return {
      success: true,
      data: data.orders,
      pagination: data.pagination,
      message: 'Orders fetched successfully',
    };
  }

  @ApiBearerAuth()
  @Get('get-order/:id')
  @UseGuards(AuthGuard)
  async getMyOrder(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.orderService.getOrderById(user.userId, id);
    return { success: true, data, message: 'Order fetched successfully' };
  }

  @ApiBearerAuth()
  @Put('items/:itemId/cancel')
  @UseGuards(AuthGuard)
  async cancelOrderItem(
    @CurrentUser() user: AuthUser,
    @Param('itemId') itemId: string,
  ) {
    const data = await this.orderService.cancelOrderItem(user.userId, itemId);
    return {
      success: true,
      data,
      message: 'Order item cancelled successfully',
    };
  }

  @ApiBearerAuth()
  @Get('pending-reviews')
  @UseGuards(AuthGuard)
  async getPendingReviews(@CurrentUser() user: AuthUser) {
    const data = await this.orderService.getPendingReviews(user.userId);
    return {
      success: true,
      data,
      message: 'Pending reviews fetched successfully',
    };
  }

  // ── Seller ────────────────────────────────────────────────────────────────────
  @ApiBearerAuth()
  @AuthRoles('seller')
  @Get('seller')
  async listSellerOrderItems(
    @CurrentUser() user: AuthUser,
    @Query() query: ListOrdersQueryDto,
  ) {
    const data = await this.orderService.listSellerOrderItems(
      user.userId,
      query,
    );
    return {
      success: true,
      data: data.items,
      pagination: data.pagination,
      message: 'Order items fetched successfully',
    };
  }

  @ApiBearerAuth()
  @AuthRoles('seller')
  @Get('seller/items/:id')
  async sellerGetOrderItem(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.orderService.sellerGetOrderItem(id, user.userId);
    return { success: true, data, message: 'Order Item fetched successfully' };
  }

  @ApiBearerAuth()
  @AuthRoles('seller')
  @Put('seller/items/:itemId/status')
  async updateOrderItemStatus(
    @CurrentUser() user: AuthUser,
    @Param('itemId') itemId: string,
    @Body() body: UpdateOrderItemStatusDto,
  ) {
    const data = await this.orderService.updateOrderItemStatus(
      user.userId,
      itemId,
      body,
    );
    return {
      success: true,
      data,
      message: 'Order item status updated successfully',
    };
  }

  // ── Admin ─────────────────────────────────────────────────────────────────────
  @ApiBearerAuth()
  @AuthRoles('admin')
  @Put('admin/items/:itemId/status')
  async adminUpdateOrderItemStatus(
    @Param('itemId') itemId: string,
    @Body() body: UpdateOrderItemStatusDto,
  ) {
    const data = await this.orderService.adminUpdateOrderItemStatus(
      itemId,
      body,
    );
    return {
      success: true,
      data,
      message: 'Order item status updated successfully',
    };
  }

  @ApiBearerAuth()
  @AuthRoles('admin')
  @Get('admin')
  async adminListOrders(@Query() query: ListOrdersQueryDto) {
    const data = await this.orderService.adminListOrders(query);
    return {
      success: true,
      data: data.orders,
      pagination: data.pagination,
      message: 'Orders fetched successfully',
    };
  }

  @ApiBearerAuth()
  @AuthRoles('admin')
  @Get('admin/:id')
  async adminGetOrder(@Param('id') id: string) {
    const data = await this.orderService.adminGetOrder(id);
    return { success: true, data, message: 'Order fetched successfully' };
  }

  @ApiBearerAuth()
  @AuthRoles('admin')
  @Patch('admin/:id')
  async adminUpdateOrder(
    @Param('id') id: string,
    @Body() body: AdminUpdateOrderDto,
  ) {
    const data = await this.orderService.adminUpdateOrder(id, body);
    return { success: true, data, message: 'Order updated successfully' };
  }
}
