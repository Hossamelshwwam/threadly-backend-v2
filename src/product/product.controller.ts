import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ProductService } from './product.service';
import type { AuthUser } from 'src/common/types/user.type';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/cloudinary/multer.config';
import {
  CreateProductDto,
  DeleteProductImageDto,
  ListProductsQueryDto,
  UpdateProductDto,
} from './dto/product.dto';
import { AuthRoles } from 'src/common/decorator/auth-roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ── Create Products ────────────────────────────────────────────────────────────────────
  @AuthRoles('admin', 'seller')
  @Post()
  @ApiBearerAuth()
  async createProduct(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateProductDto,
  ) {
    const data = await this.productService.createProduct(
      user.userId,
      user.role,
      body,
    );
    return { data, message: 'Product created', success: true };
  }

  // ── Get Products ────────────────────────────────────────────────────────────────────
  @Get()
  async listProducts(@Query() query: ListProductsQueryDto) {
    const data = await this.productService.listProducts(query);
    return {
      data: data.products,
      message: 'Product fetched',
      success: true,
      pagination: data.pagination,
    };
  }

  // ── Get Products by Admin ────────────────────────────────────────────────────────────────────
  @AuthRoles('admin')
  @Get('admin')
  @ApiBearerAuth()
  async adminListProducts(@Query() query: ListProductsQueryDto) {
    const data = await this.productService.adminListProducts(query);
    return {
      data: data.products,
      message: 'Product fetched',
      success: true,
      pagination: data.pagination,
    };
  }

  // ── Get Product by Admin ────────────────────────────────────────────────────────────────────
  @AuthRoles('admin')
  @Get('admin/:id')
  @ApiBearerAuth()
  async getAdminProduct(@Param('id') id: string) {
    const data = await this.productService.getAdminProduct(id);
    return { data, message: 'Product fetched', success: true };
  }

  // ── Get Product by Seller ────────────────────────────────────────────────────────────────────
  @AuthRoles('seller')
  @Get('me/:id')
  @ApiBearerAuth()
  async getSellerProduct(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.productService.getSellerProduct(id, user.userId);
    return { data, message: 'Product fetched', success: true };
  }

  // ── Archive Products by Admin ────────────────────────────────────────────────────────────────────
  @AuthRoles('admin')
  @Patch('admin/:id/archive')
  @ApiBearerAuth()
  async adminArchiveProduct(@Param('id') id: string) {
    const data = await this.productService.adminArchiveProduct(id);
    return {
      data,
      message: 'Product archived by admin',
      success: true,
    };
  }

  // ── Add Images Products ────────────────────────────────────────────────────────────────────
  @AuthRoles('admin', 'seller')
  @Post('me/:id/images')
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('images', 8, multerConfig))
  async uploadImages(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /image\/(jpeg|png|webp)/ }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    if (files.length === 0) {
      throw new BadRequestException('no images uploaded');
    }
    const buffers = files.map((f) => f.buffer);
    const data = await this.productService.uploadProductImages(
      user.userId,
      user.role,
      id,
      buffers,
    );
    return { data, message: 'Images uploaded', success: true };
  }

  // ── Delete Image Products ────────────────────────────────────────────────────────────────────
  @AuthRoles('admin', 'seller')
  @Delete('me/:id/images')
  @ApiBearerAuth()
  async deleteImage(
    @Body() body: DeleteProductImageDto,
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.productService.deleteProductImage(
      user.userId,
      user.role,
      id,
      body.imageUrl,
    );
    return { data: null, message: 'Image deleted', success: true };
  }

  // ── Update Product ────────────────────────────────────────────────────────────────────
  @AuthRoles('admin', 'seller')
  @Put('me/:id')
  @ApiBearerAuth()
  async updateProduct(
    @Body() body: UpdateProductDto,
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.productService.updateProduct(
      user.userId,
      user.role,
      id,
      body,
    );
    return { data, message: 'Product updated', success: true };
  }

  // ── Archive Product ────────────────────────────────────────────────────────────────────
  @AuthRoles('admin', 'seller')
  @Delete('me/:id')
  @ApiBearerAuth()
  async archiveProduct(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.productService.archiveProduct(
      user.userId,
      user.role,
      id,
    );
    return { data, message: 'Product archived', success: true };
  }

  // ── Get Own Products ────────────────────────────────────────────────────────────────────
  @AuthRoles('seller')
  @Get('me')
  @ApiBearerAuth()
  async listMyProducts(
    @CurrentUser() user: AuthUser,
    @Query() query: ListProductsQueryDto,
  ) {
    const data = await this.productService.listMyProducts(
      user.userId,
      user.role,
      query,
    );
    return {
      data: data.products,
      message: 'Product fetched',
      success: true,
      pagination: data.pagination,
    };
  }

  // ── Get Product by Slug ────────────────────────────────────────────────────────────────────
  @Get(':slug')
  async getProductBySlug(@Param('slug') slug: string) {
    const data = await this.productService.getProductBySlug(slug);
    return { data, message: 'Product fetched', success: true };
  }
}
