import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { UserDocument } from './schema/user.schema';
import { Model } from 'mongoose';
import {
  AddAddressDto,
  GetAllAdminsQueryDto,
  UpdateAdminDto,
  ChangePasswordDto,
  UpdateAddressDto,
  UpdateProfileDto,
} from './dto/user-dto';
import { PaginationService } from 'src/common/services/pagination.service';
import { OrderDocument } from 'src/order/schema/order.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    @InjectModel('Order') private readonly orderModel: Model<OrderDocument>,
    private readonly paginationService: PaginationService,
  ) {}

  comparePassword(plain: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plain, passwordHash);
  }

  generateVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return { token, hashedToken, verificationTokenExpiry };
  }

  generatePasswordResetToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);
    return { token, hashedToken, passwordResetExpiry };
  }

  async getMyProfile(userId: string) {
    return await this.userModel.findById(userId).select('-password');
  }

  // ── Update own profile ────────────────────────────────────────────────────────
  async updateMyProfile(userId: string, body: UpdateProfileDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (body.name) user.name = body.name;
    if (body.phone) user.phone = body.phone;

    await user.save();
    return user;
  }

  // ── Change password ───────────────────────────────────────────────────────────
  async changePassword(userId: string, body: ChangePasswordDto) {
    const user = await this.userModel.findById(userId).select('+passwordHash');
    if (!user) throw new NotFoundException('User not found');

    const valid = await this.comparePassword(
      body.currentPassword,
      user.passwordHash,
    );
    if (!valid) throw new NotFoundException('Current password is incorrect');

    user.passwordHash = body.newPassword; // pre-save hook hashes it
    await user.save();
  }

  // ── List addresses ────────────────────────────────────────────────────────────
  async listAddresses(userId: string) {
    const user = await this.userModel.findById(userId).select('addresses');
    if (!user) throw new NotFoundException('User not found');
    return user.addresses ?? [];
  }

  // ── Add address ───────────────────────────────────────────────────────────────
  async addAddress(userId: string, body: AddAddressDto) {
    const user = await this.userModel.findById(userId).select('addresses');
    if (!user) throw new NotFoundException('User not found');

    if (!user.addresses) user.addresses = [];

    // If this is the first address or marked as default — clear other defaults
    if (body.isDefault || user.addresses.length === 0) {
      user.addresses.forEach((a) => (a.isDefault = false));
      body.isDefault = true;
    }

    user.addresses.push(body);
    await user.save();
    return user.addresses;
  }

  // ── Update address ────────────────────────────────────────────────────────────
  async updateAddress(
    userId: string,
    addressId: string,
    body: UpdateAddressDto,
  ) {
    const user = await this.userModel.findById(userId).select('addresses');
    if (!user) throw new NotFoundException('User not found');

    const address = user.addresses.find((a) => a._id?.toString() === addressId);
    if (!address) throw new NotFoundException('Address not found');

    // If setting this as default — clear others first
    if (body.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }

    if (body.label !== undefined) address.label = body.label;
    if (body.street !== undefined) address.street = body.street;
    if (body.city !== undefined) address.city = body.city;
    if (body.state !== undefined) address.state = body.state;
    if (body.postalCode !== undefined) address.postalCode = body.postalCode;
    if (body.country !== undefined) address.country = body.country;
    if (body.isDefault !== undefined) address.isDefault = body.isDefault;

    await user.save();
    return user.addresses;
  }

  // ── Delete address ────────────────────────────────────────────────────────────
  async deleteAddress(userId: string, addressId: string) {
    const user = await this.userModel.findById(userId).select('addresses');
    if (!user) throw new NotFoundException('User not found');

    const address = user.addresses.find(
      (addr) => addr._id?.toString() === addressId,
    );

    if (!address) throw new NotFoundException('Address not found');

    const wasDefault = address.isDefault;

    user.addresses = user.addresses.filter(
      (addr) => addr._id?.toString() !== addressId,
    );

    // If deleted address was default — auto-assign default to first remaining
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return user.addresses;
  }

  // ── Set default address ───────────────────────────────────────────────────────
  async setDefaultAddress(userId: string, addressId: string) {
    const user = await this.userModel.findById(userId).select('addresses');
    if (!user) throw new NotFoundException('User not found');

    const address = user.addresses.find(
      (addr) => addr._id?.toString() === addressId,
    );

    if (!address) throw new NotFoundException('Address not found');

    user.addresses?.forEach((a) => (a.isDefault = false));
    address.isDefault = true;

    await user.save();
    return user.addresses;
  }

  // ── Admin: list users ─────────────────────────────────────────────────────────
  async getAllAdmins(query: GetAllAdminsQueryDto) {
    const { skip, limit, page } = this.paginationService.getPagination(
      query.page,
      query.limit,
    );

    const filter: Record<string, unknown> = {};
    if (query.role) filter.role = query.role;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.userModel.countDocuments(filter),
    ]);

    return {
      users,
      pagination: this.paginationService.buildPaginationMeta(
        total,
        page,
        limit,
      ),
    };
  }

  // ── Admin: get user detail ────────────────────────────────────────────────────
  async getAdmin(userId: string) {
    const user = await this.userModel.findById(userId).select('-passwordHash');
    if (!user) throw new NotFoundException('User not found');

    // Attach order stats
    const [orderCount, totalSpent] = await Promise.all([
      this.orderModel.countDocuments({ buyerId: userId }),
      this.orderModel.aggregate([
        { $match: { buyerId: user._id, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    const recentOrders = await this.orderModel
      .find({ buyerId: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      user,
      stats: {
        orderCount,
        totalSpent: totalSpent[0]?.total ?? 0,
      },
      recentOrders,
    };
  }

  // ── Admin: suspend / reactivate user ─────────────────────────────────────────
  async updateAdmin(userId: string, body: UpdateAdminDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.role === 'admin')
      throw new ForbiddenException('Cannot modify another admin');

    user.isActive = body.isActive;
    await user.save();
    return user;
  }
}
