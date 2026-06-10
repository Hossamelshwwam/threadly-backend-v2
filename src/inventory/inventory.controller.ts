import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import type { AuthUser } from 'src/common/types/user.type';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import {
  BulkCreateVariantsDto,
  CreateVariantDto,
  RestockVariantDto,
  UpdateVariantDto,
} from './dto/inventory.dto';
import { AuthRoles } from 'src/common/decorator/auth-roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @AuthRoles('admin', 'seller')
  @Post('/:productId/variants')
  @ApiBearerAuth()
  async createVariant(
    @Body() body: CreateVariantDto,
    @Param('productId') productId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.inventoryService.createVariant(
      user.userId,
      user.role,
      productId,
      body,
    );

    return { data, message: 'Variant created', success: true };
  }

  @AuthRoles('admin', 'seller')
  @Post('/:productId/variants/bulk')
  @ApiBearerAuth()
  async bulkCreateVariants(
    @Body() body: BulkCreateVariantsDto,
    @Param('productId') productId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.inventoryService.bulkCreateVariants(
      user.userId,
      user.role,
      productId,
      body,
    );
    return { data, message: 'Variants created', success: true };
  }

  @AuthRoles()
  @Get('/:productId/variants')
  @ApiBearerAuth()
  async listVariants(@Param('productId') productId: string) {
    const data = await this.inventoryService.listVariants(productId);
    return { data, message: 'Variants fetched', success: true };
  }

  @AuthRoles('admin', 'seller')
  @Put('/variants/:variantId')
  @ApiBearerAuth()
  async updateVariant(
    @Body() body: UpdateVariantDto,
    @Param('variantId') variantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.inventoryService.updateVariant(
      user.userId,
      user.role,
      variantId,
      body,
    );
    return { data, message: 'Variant updated', success: true };
  }

  @AuthRoles('admin', 'seller')
  @Delete('/variants/:variantId')
  @ApiBearerAuth()
  async deleteVariant(
    @Param('variantId') variantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.inventoryService.deleteVariant(
      user.userId,
      user.role,
      variantId,
    );
    return { data: null, message: 'Variant deleted', success: true };
  }

  @AuthRoles('admin', 'seller')
  @Patch('/variants/:variantId/restock')
  @ApiBearerAuth()
  async restockVariant(
    @Body() body: RestockVariantDto,
    @Param('variantId') variantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const { quantity } = body;
    const data = await this.inventoryService.restockVariant(
      user.userId,
      user.role,
      variantId,
      Number(quantity),
    );
    return { data, message: 'Stock updated', success: true };
  }
}
