import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PayoutService } from './payout.service';
import { AuthRoles } from 'src/common/decorator/auth-roles.decorator';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import type { AuthUser } from 'src/common/types/user.type';
import { ListPayoutsQueryDto, UpdatePayoutStatusDto } from './dto/payout.dto';

@Controller('payouts')
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  // ── Seller ────────────────────────────────────────────────────────────────────
  @ApiBearerAuth()
  @AuthRoles('seller')
  @Get('seller')
  async listMyPayouts(
    @CurrentUser() user: AuthUser,
    @Query() query: ListPayoutsQueryDto,
  ) {
    const data = await this.payoutService.listMyPayouts(user.userId, query);
    return { success: true, data, message: 'Payouts fetched successfully' };
  }

  @ApiBearerAuth()
  @AuthRoles('seller')
  @Get('seller/:id')
  async getMyPayout(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.payoutService.getMyPayout(user.userId, id);
    return { success: true, data, message: 'Payout fetched successfully' };
  }

  // ── Admin ─────────────────────────────────────────────────────────────────────
  @ApiBearerAuth()
  @AuthRoles('admin')
  @Get('admin/stats')
  async adminPayoutStats() {
    const data = await this.payoutService.adminPayoutStats();
    return {
      success: true,
      data,
      message: 'Payout stats fetched successfully',
    };
  }

  @ApiBearerAuth()
  @AuthRoles('admin')
  @Get('admin')
  async adminListPayouts(@Query() query: ListPayoutsQueryDto) {
    const data = await this.payoutService.adminListPayouts(query);
    return { success: true, data, message: 'Payouts fetched successfully' };
  }

  @ApiBearerAuth()
  @AuthRoles('admin')
  @Get('admin/:id')
  async adminGetPayout(@Param('id') id: string) {
    const data = await this.payoutService.adminGetPayout(id);
    return { success: true, data, message: 'Payout fetched successfully' };
  }

  @ApiBearerAuth()
  @AuthRoles('admin')
  @Patch('admin/:id/status')
  async adminUpdatePayoutStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdatePayoutStatusDto,
  ) {
    const data = await this.payoutService.adminUpdatePayoutStatus(
      user.userId,
      id,
      body,
    );
    return { success: true, data, message: `Payout ${body.status}` };
  }
}
