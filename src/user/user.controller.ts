import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
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
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthRoles } from 'src/common/decorator/auth-roles.decorator';
import type { AuthUser } from 'src/common/types/user.type';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth()
  @AuthRoles('admin')
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
  @Patch('me/addresses/{id}/default')
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
    };
  }

  @ApiBearerAuth()
  @Get('admin')
  async getAdmin(@Param('id') id: string) {
    const data = await this.userService.getAdmin(id);
    return {
      success: true,
      data,
      message: 'Admin fetched successfully',
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
