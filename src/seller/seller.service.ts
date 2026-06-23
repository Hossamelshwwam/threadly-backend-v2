import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SellerDocument } from './schema/seller.schema';
import { UserDocument } from '../user/schema/user.schema';
import {
  AdminUpdateSellerStatusDto,
  RegisterSellerDto,
  UpdateSellerDto,
  AdminListSellersQueryDto,
} from './dto/seller.dto';
import { PaginationService } from '../common/services/pagination.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SlugService } from '../common/services/slug.service';
import { MailerService } from '@nestjs-modules/mailer';
import { Types } from 'mongoose';

@Injectable()
export class SellerService {
  constructor(
    @InjectModel('Seller')
    private readonly sellerModel: Model<SellerDocument>,
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    private readonly paginationService: PaginationService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly slugService: SlugService,
    private readonly mailerService: MailerService,
  ) {}

  // ── helper ──────────────────────────────────────────────────────────────────
  private async sendSellerApprovalEmail(
    to: string,
    name: string,
    approved: boolean,
    note?: string,
  ) {
    await this.mailerService.sendMail({
      to,
      subject: approved
        ? '🎉 Your store has been approved!'
        : 'Store application update',
      html: `
      <h2>Hi ${name},</h2>

      ${
        approved
          ? `
            <p>
              Congratulations! Your store on Threadly has been
              <strong>approved</strong>.
              You can now start listing products.
            </p>
          `
          : `
            <p>
              Unfortunately your store application was
              <strong>not approved</strong> at this time.
            </p>
            ${note ? `<p><strong>Reason:</strong> ${note}</p>` : ''}
          `
      }
    `,
    });
  }

  // ── Register ──────────────────────────────────────────────────────────────────
  async registerSeller(userId: string, input: RegisterSellerDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.sellerModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (existing)
      throw new ConflictException('You already have a store registered');

    let slug = this.slugService.slugify(input.storeName);
    const slugExists = await this.sellerModel.findOne({
      storeSlug: slug,
    });
    if (slugExists) {
      slug = this.slugService.uniqueSlug(
        input.storeName,
        Date.now().toString().slice(-4),
      );
    }

    const seller = await this.sellerModel.create({
      userId: new Types.ObjectId(userId),
      storeName: input.storeName,
      storeSlug: slug,
      description: input.description,
      bankDetails: {
        accountName: input.accountName,
        accountNumber: input.accountNumber,
        bankName: input.bankName,
      },
      status: 'pending',
    });

    return seller;
  }

  // ── Get own profile ───────────────────────────────────────────────────────────
  async getMySellerProfile(userId: string) {
    const seller = await this.sellerModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('userId', 'name email phone');
    if (!seller) throw new NotFoundException('Seller profile not found');
    return seller;
  }

  // ── Update own profile ────────────────────────────────────────────────────────
  async updateSellerProfile(userId: string, input: UpdateSellerDto) {
    const seller = await this.sellerModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!seller) throw new NotFoundException('Seller profile not found');
    if (seller.status === 'suspended')
      throw new ForbiddenException('Your store is suspended');

    if (input.storeName) {
      let slug = this.slugService.slugify(input.storeName);
      const slugExists = await this.sellerModel.findOne({
        storeSlug: slug,
        _id: { $ne: seller._id },
      });
      if (slugExists) {
        slug = this.slugService.uniqueSlug(
          input.storeName,
          Date.now().toString().slice(-4),
        );
      }
      seller.storeName = input.storeName;
      seller.storeSlug = slug;
    }

    if (input.description !== undefined) seller.description = input.description;

    if (input.accountName || input.accountNumber || input.bankName) {
      seller.bankDetails = {
        accountName: input.accountName ?? seller.bankDetails?.accountName ?? '',
        accountNumber:
          input.accountNumber ?? seller.bankDetails?.accountNumber ?? '',
        bankName: input.bankName ?? seller.bankDetails?.bankName ?? '',
      };
    }

    await seller.save();
    return seller;
  }

  // ── Upload logo ───────────────────────────────────────────────────────────────
  async uploadSellerLogo(userId: string, buffer: Buffer) {
    const seller = await this.sellerModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!seller) throw new NotFoundException('Seller profile not found');

    const newLogo = await this.cloudinaryService.uploadFile(buffer, 'logos');
    const oldLogo = seller.logo;

    seller.logo = newLogo.secure_url;
    await seller.save();

    if (oldLogo) {
      await this.cloudinaryService.deleteFile(oldLogo).catch(() => null);
    }
    return { logo: seller.logo };
  }

  // ── Upload banner ─────────────────────────────────────────────────────────────
  async uploadSellerBanner(userId: string, buffer: Buffer) {
    const seller = await this.sellerModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!seller) throw new NotFoundException('Seller profile not found');

    const newBanner = await this.cloudinaryService.uploadFile(
      buffer,
      'banners',
    );
    const oldBanner = seller.banner;

    seller.banner = newBanner.secure_url;
    await seller.save();

    if (oldBanner) {
      await this.cloudinaryService.deleteFile(oldBanner).catch(() => null);
    }
    return { banner: seller.banner };
  }

  // ── Public storefront ─────────────────────────────────────────────────────────
  async getPublicStorefront(slug: string) {
    const seller = await this.sellerModel
      .findOne({ storeSlug: slug, status: 'approved' })
      .populate('userId', 'name')
      .select('-bankDetails -adminNote');
    if (!seller) throw new NotFoundException('Store not found');
    return seller;
  }

  // ── Admin: list all sellers ───────────────────────────────────────────────────
  async adminListSellers(query: AdminListSellersQueryDto) {
    const { skip, limit, page } = this.paginationService.getPagination(
      query.page,
      query.limit,
    );

    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;

    const [sellers, total] = await Promise.all([
      this.sellerModel
        .find(filter)
        .populate('userId', 'name email phone createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.sellerModel.countDocuments(filter),
    ]);

    return {
      sellers,
      pagination: this.paginationService.buildPaginationMeta(
        total,
        page,
        limit,
      ),
    };
  }

  // ── Admin: get single seller ──────────────────────────────────────────────────
  async adminGetSeller(sellerId: string) {
    const seller = await this.sellerModel
      .findById(sellerId)
      .populate('userId', 'name email phone createdAt');
    if (!seller) throw new NotFoundException('Seller not found');
    return seller;
  }

  // ── Admin: update seller status ───────────────────────────────────────────────
  async adminUpdateSellerStatus(
    sellerId: string,
    input: AdminUpdateSellerStatusDto,
  ) {
    const seller = await this.sellerModel.findById(sellerId);
    if (!seller) throw new NotFoundException('Seller not found');

    const user = await this.userModel.findById(seller.userId).exec();
    if (!user) throw new NotFoundException('User not found');

    seller.status = input.status;
    if (input.adminNote) seller.adminNote = input.adminNote;
    await seller.save();

    await this.sendSellerApprovalEmail(
      user.email,
      user.name,
      input.status === 'approved',
      input.adminNote,
    ).catch(() => null);

    user.role = 'seller';
    await user.save();

    return seller;
  }
}
