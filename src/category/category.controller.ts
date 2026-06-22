import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpException,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import {
  AdminListCategoriesQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/category.dto';
import { AuthRoles } from '../common/decorator/auth-roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../cloudinary/multer.config';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async listCategories() {
    const data = await this.categoryService.listCategories(true);
    return { data, message: 'Categories fetched', success: true };
  }

  @AuthRoles('admin')
  @Get('admin')
  @ApiBearerAuth()
  async adminListCategories(@Query() query: AdminListCategoriesQueryDto) {
    const data = await this.categoryService.adminListCategories(query);

    return {
      data: data.categories,
      pagination: data.pagination,
      message: 'Categories fetched',
      success: true,
    };
  }

  @AuthRoles('admin')
  @Post('admin')
  @ApiBearerAuth()
  async createCategory(@Body() body: CreateCategoryDto) {
    const data = await this.categoryService.createCategory(body);
    return { data, message: 'Category created', success: true };
  }

  @AuthRoles('admin')
  @Patch('admin/:id/image')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image', multerConfig))
  async uploadCategoryImage(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /image\/(jpeg|png|webp)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Param('id') id: string,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    const data = await this.categoryService.uploadCategoryImage(id, file);
    return { data, message: 'Image uploaded', success: true };
  }

  @AuthRoles('admin')
  @Put('admin/:id')
  @ApiBearerAuth()
  async updateCategory(
    @Param('id') id: string,
    @Body() body: UpdateCategoryDto,
  ) {
    const data = await this.categoryService.updateCategory(id, body);
    return { data, message: 'Category updated', success: true };
  }

  @AuthRoles('admin')
  @Delete('admin/:id')
  @ApiBearerAuth()
  async deleteCategory(@Param('id') id: string) {
    await this.categoryService.deleteCategory(id);
    return { data: null, message: 'Category deleted', success: true };
  }

  @AuthRoles()
  @Get(':slug')
  async getCategoryBySlug(@Param('slug') slug: string) {
    const data = await this.categoryService.getCategoryBySlug(slug);
    return { data, message: 'Category fetched', success: true };
  }
}
