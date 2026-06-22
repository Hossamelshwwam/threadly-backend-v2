import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CurrentUser } from '../common/decorator/current-user.decorator';
import type { AuthUser } from '../common/types/user.type';
import { AddToCartDto, UpdateCartItemDto } from './dt/cart.dto';
import { AuthRoles } from '../common/decorator/auth-roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @AuthRoles()
  @Get()
  @ApiBearerAuth()
  async getCart(@CurrentUser() user: AuthUser) {
    const data = await this.cartService.getCart(user.userId);
    return { data, message: 'Cart fetched', success: true };
  }

  @AuthRoles()
  @Post('items')
  @ApiBearerAuth()
  async addToCart(@CurrentUser() user: AuthUser, @Body() body: AddToCartDto) {
    const data = await this.cartService.addToCart(user.userId, body);
    return { data, message: 'Item added to cart', success: true };
  }

  @AuthRoles()
  @Put('items/:inventoryId')
  @ApiBearerAuth()
  async updateCartItem(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateCartItemDto,
    @Param('inventoryId') inventoryId: string,
  ) {
    const data = await this.cartService.updateCartItem(
      user.userId,
      inventoryId,
      body,
    );
    return { data, message: 'Cart updated', success: true };
  }

  @AuthRoles()
  @Delete('items/:inventoryId')
  @ApiBearerAuth()
  async removeCartItem(
    @CurrentUser() user: AuthUser,
    @Param('inventoryId') inventoryId: string,
  ) {
    const data = await this.cartService.removeCartItem(
      user.userId,
      inventoryId,
    );
    return { data, message: 'Item removed from cart', success: true };
  }
}
