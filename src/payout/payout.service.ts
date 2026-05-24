import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PayoutDocument } from './schema/payout.schema';
import { SellerDocument } from '../seller/schema/seller.schema';
import { ListPayoutsQueryDto, UpdatePayoutStatusDto } from './dto/payout.dto';
import { PaginationService } from 'src/common/services/pagination.service';

@Injectable()
export class PayoutService {
  constructor(
    @InjectModel('Payout')
    private readonly payoutModel: Model<PayoutDocument>,
    @InjectModel('Seller') private readonly sellerModel: Model<SellerDocument>,
    private readonly paginationService: PaginationService,
  ) {}

  // ── Seller: list own payouts ──────────────────────────────────────────────────
  async listMyPayouts(userId: string, query: ListPayoutsQueryDto) {
    const seller = await this.sellerModel.findOne({ userId });
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

    const [payouts, total] = await Promise.all([
      this.payoutModel
        .find(filter)
        .populate('orderId', 'orderNumber total createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.payoutModel.countDocuments(filter),
    ]);

    const [summary] = await this.payoutModel.aggregate([
      { $match: { sellerId: seller._id } },
      {
        $group: {
          _id: null,
          totalEarned: { $sum: '$amount' },
          totalFees: { $sum: '$platformFee' },
          totalNet: { $sum: '$netAmount' },
          totalPaid: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$netAmount', 0] },
          },
          totalPending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$netAmount', 0] },
          },
          totalProcessing: {
            $sum: {
              $cond: [{ $eq: ['$status', 'processing'] }, '$netAmount', 0],
            },
          },
        },
      },
    ]);

    return {
      payouts,
      pagination: this.paginationService.buildPaginationMeta(
        total,
        page,
        limit,
      ),
      summary: summary ?? {
        totalEarned: 0,
        totalFees: 0,
        totalNet: 0,
        totalPaid: 0,
        totalPending: 0,
        totalProcessing: 0,
      },
    };
  }

  // ── Seller: get single payout ─────────────────────────────────────────────────
  async getMyPayout(userId: string, payoutId: string) {
    const seller = await this.sellerModel.findOne({ userId });
    if (!seller) throw new NotFoundException('Seller profile not found');

    const payout = await this.payoutModel
      .findById(payoutId)
      .populate('orderId', 'orderNumber total shippingAddress createdAt')
      .populate('processedBy', 'name email');

    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.sellerId.toString() !== seller._id.toString()) {
      throw new ForbiddenException('Forbidden');
    }

    return payout;
  }

  // ── Admin: list all payouts ───────────────────────────────────────────────────
  async adminListPayouts(query: ListPayoutsQueryDto) {
    const { skip, limit, page } = this.paginationService.getPagination(
      query.page,
      query.limit,
    );

    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.seller) filter.sellerId = query.seller;
    if (query.from || query.to) {
      filter.createdAt = {
        ...(query.from && { $gte: new Date(query.from) }),
        ...(query.to && { $lte: new Date(query.to) }),
      };
    }

    const [payouts, total] = await Promise.all([
      this.payoutModel
        .find(filter)
        .populate('sellerId', 'storeName storeSlug bankDetails')
        .populate('orderId', 'orderNumber total createdAt')
        .populate('processedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.payoutModel.countDocuments(filter),
    ]);

    const aggPipeline: any[] = [];
    if (Object.keys(filter).length > 0) {
      aggPipeline.push({ $match: filter });
    }
    aggPipeline.push({
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalFees: { $sum: '$platformFee' },
        totalNet: { $sum: '$netAmount' },
        totalPaid: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$netAmount', 0] },
        },
        totalPending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$netAmount', 0] },
        },
        totalProcessing: {
          $sum: {
            $cond: [{ $eq: ['$status', 'processing'] }, '$netAmount', 0],
          },
        },
        totalRejected: {
          $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, '$netAmount', 0] },
        },
      },
    });

    const [summary] = await this.payoutModel.aggregate(aggPipeline);

    return {
      payouts,
      pagination: this.paginationService.buildPaginationMeta(
        total,
        page,
        limit,
      ),
      summary: summary ?? {
        totalAmount: 0,
        totalFees: 0,
        totalNet: 0,
        totalPaid: 0,
        totalPending: 0,
        totalProcessing: 0,
        totalRejected: 0,
      },
    };
  }

  // ── Admin: get single payout ──────────────────────────────────────────────────
  async adminGetPayout(payoutId: string) {
    const payout = await this.payoutModel
      .findById(payoutId)
      .populate('sellerId', 'storeName storeSlug bankDetails rating totalSales')
      .populate(
        'orderId',
        'orderNumber total shippingAddress paymentMethod createdAt',
      )
      .populate('processedBy', 'name email');

    if (!payout) throw new NotFoundException('Payout not found');
    return payout;
  }

  // ── Admin: update payout status ───────────────────────────────────────────────
  async adminUpdatePayoutStatus(
    adminId: string,
    payoutId: string,
    input: UpdatePayoutStatusDto,
  ) {
    const payout = await this.payoutModel.findById(payoutId);
    if (!payout) throw new NotFoundException('Payout not found');

    const transitions: Record<string, string[]> = {
      pending: ['processing', 'rejected'],
      processing: ['paid', 'rejected'],
    };

    const allowed = transitions[payout.status] ?? [];
    if (!allowed.includes(input.status)) {
      throw new BadRequestException(
        `Cannot transition from "${payout.status}" to "${input.status}"`,
      );
    }

    payout.status = input.status;
    payout.processedBy = adminId as any;
    if (input.adminNote) payout.adminNote = input.adminNote;

    await payout.save();
    return payout;
  }

  // ── Admin: summary stats ──────────────────────────────────────────────────────
  async adminPayoutStats() {
    const stats = await this.payoutModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          netAmount: { $sum: '$netAmount' },
        },
      },
    ]);

    const result: Record<string, { count: number; netAmount: number }> = {
      pending: { count: 0, netAmount: 0 },
      processing: { count: 0, netAmount: 0 },
      paid: { count: 0, netAmount: 0 },
      rejected: { count: 0, netAmount: 0 },
    };

    for (const s of stats) {
      if (result[s._id]) {
        result[s._id] = { count: s.count, netAmount: s.netAmount };
      }
    }

    return result;
  }
}
