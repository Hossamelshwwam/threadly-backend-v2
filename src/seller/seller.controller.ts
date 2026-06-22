import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SellerService } from './seller.service';
import { AuthRoles } from '../common/decorator/auth-roles.decorator';
import { CurrentUser } from '../common/decorator/current-user.decorator';
import type { AuthUser } from '../common/types/user.type';
import {
  AdminUpdateSellerStatusDto,
  RegisterSellerDto,
  UpdateSellerDto,
  AdminListSellersQueryDto,
} from './dto/seller.dto';

@Controller('sellers')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  // ── Public ────────────────────────────────────────────────────────────────────
  @Get('stores/:slug')
  async getStorefront(@Param('slug') slug: string) {
    const data = await this.sellerService.getPublicStorefront(slug);
    return { success: true, data, message: 'Storefront fetched successfully' };
  }

  // ── Authenticated seller ──────────────────────────────────────────────────────
  @AuthRoles()
  @Post('register')
  @ApiBearerAuth()
  async registerSeller(
    @CurrentUser() user: AuthUser,
    @Body() body: RegisterSellerDto,
  ) {
    const data = await this.sellerService.registerSeller(user.userId, body);
    return {
      success: true,
      data,
      message: 'Store registered successfully. Awaiting admin approval.',
    };
  }

  @AuthRoles()
  @Get('profile')
  @ApiBearerAuth()
  async getMyProfile(@CurrentUser() user: AuthUser) {
    const data = await this.sellerService.getMySellerProfile(user.userId);
    return { success: true, data, message: 'Profile fetched successfully' };
  }

  @AuthRoles()
  @Put('profile')
  @ApiBearerAuth()
  async updateMyProfile(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateSellerDto,
  ) {
    const data = await this.sellerService.updateSellerProfile(
      user.userId,
      body,
    );
    return { success: true, data, message: 'Profile updated successfully' };
  }

  @AuthRoles()
  @Patch('profile/logo')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  async uploadLogo(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const data = await this.sellerService.uploadSellerLogo(
      user.userId,
      file.buffer,
    );
    return { success: true, data, message: 'Logo updated successfully' };
  }

  @AuthRoles()
  @Patch('profile/banner')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  async uploadBanner(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const data = await this.sellerService.uploadSellerBanner(
      user.userId,
      file.buffer,
    );
    return { success: true, data, message: 'Banner updated successfully' };
  }

  // ── Admin ─────────────────────────────────────────────────────────────────────
  @AuthRoles('admin')
  @Get('admin')
  @ApiBearerAuth()
  async adminListSellers(@Query() query: AdminListSellersQueryDto) {
    const data = await this.sellerService.adminListSellers(query);
    return {
      success: true,
      data: data.sellers,
      pagination: data.pagination,
      message: 'Sellers fetched successfully',
    };
  }

  @AuthRoles('admin')
  @Get('admin/:id')
  @ApiBearerAuth()
  async adminGetSeller(@Param('id') id: string) {
    const data = await this.sellerService.adminGetSeller(id);
    return { success: true, data, message: 'Seller fetched successfully' };
  }

  @AuthRoles('admin')
  @Patch('admin/:id/status')
  @ApiBearerAuth()
  async adminUpdateSellerStatus(
    @Param('id') id: string,
    @Body() body: AdminUpdateSellerStatusDto,
  ) {
    const data = await this.sellerService.adminUpdateSellerStatus(id, body);
    return {
      success: true,
      data,
      message: `Seller status updated to ${body.status}`,
    };
  }
}
