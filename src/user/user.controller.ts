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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  AddAddressDto,
  ChangePasswordDto,
  GetAllAdminsQueryDto,
  UpdateAddressDto,
  UpdateAdminDto,
  UpdateProfileDto,
} from './dto/user-dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { AuthRoles } from 'src/common/decorator/auth-roles.decorator';
import type { AuthUser } from 'src/common/types/user.type';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/cloudinary/multer.config';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @AuthRoles()
  @Patch('me/avatar')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('avatar', multerConfig))
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
    @CurrentUser() user: AuthUser,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    const data = await this.userService.uploadUserImage(user.userId, file);
    return { data, message: 'Image uploaded', success: true };
  }

  @ApiBearerAuth()
  @AuthRoles()
  @Get('me')
  async getMe(@CurrentUser() user: AuthUser) {
    const data = await this.userService.getMyProfile(user.userId);
    return {
      success: true,
      data,
      message: 'User profile fetched successfully',
    };
  }

  @ApiBearerAuth()
  @Put('me')
  @UseGuards(AuthGuard)
  async updateMe(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateProfileDto,
  ) {
    const data = await this.userService.updateMyProfile(user.userId, body);
    return {
      success: true,
      data,
      message: 'User profile updated successfully',
    };
  }

  @ApiBearerAuth()
  @Patch('me/change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() body: ChangePasswordDto,
  ) {
    const data = await this.userService.changePassword(user.userId, body);
    return {
      success: true,
      data,
      message: 'Password changed successfully',
    };
  }

  @ApiBearerAuth()
  @Get('me/addresses')
  @UseGuards(AuthGuard)
  async listAddresses(@CurrentUser() user: AuthUser) {
    const data = await this.userService.listAddresses(user.userId);
    return {
      success: true,
      data,
      message: 'Addresses fetched successfully',
    };
  }

  @ApiBearerAuth()
  @Post('me/addresses')
  async addAddress(@CurrentUser() user: AuthUser, @Body() body: AddAddressDto) {
    const data = await this.userService.addAddress(user.userId, body);
    return { success: true, data, message: 'Address added successfully' };
  }

  @ApiBearerAuth()
  @Put('me/addresses/:id')
  async updateAddress(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateAddressDto,
    @Param('id') id: string,
  ) {
    const data = await this.userService.updateAddress(user.userId, id, body);
    return { success: true, data, message: 'Address updated successfully' };
  }

  @ApiBearerAuth()
  @Delete('me/addresses/:id')
  async deleteAddress(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.userService.deleteAddress(user.userId, id);
    return { success: true, data, message: 'Address deleted successfully' };
  }

  @ApiBearerAuth()
  @Patch('me/addresses/:id/default')
  async setDefaultAddress(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    const data = await this.userService.setDefaultAddress(user.userId, id);
    return {
      success: true,
      data,
      message: 'Address set as default successfully',
    };
  }

  @ApiBearerAuth()
  @Get('admin')
  async getAllAdmin(@Query() query: GetAllAdminsQueryDto) {
    const data = await this.userService.getAllAdmins(query);
    return {
      success: true,
      data: data.users,
      message: 'Admins fetched successfully',
      pagination: data.pagination,
    };
  }

  @ApiBearerAuth()
  @Get('admin/:id')
  async getAdmin(@Param('id') id: string) {
    const data = await this.userService.getAdmin(id);
    return {
      success: true,
      data,
      message: 'User fetched successfully',
    };
  }

  @ApiBearerAuth()
  @Patch('admin/:id')
  async updateAdmin(@Param('id') id: string, @Body() body: UpdateAdminDto) {
    const data = await this.userService.updateAdmin(id, body);
    return {
      success: true,
      data,
      message: 'Admin fetched successfully',
    };
  }
}
