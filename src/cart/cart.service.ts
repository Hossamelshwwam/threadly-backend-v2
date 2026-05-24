import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CartDocument } from './schema/cart.schema';
import { Model } from 'mongoose';
import { ProductDocument } from 'src/product/schema/product.schema';

import { InventoryDocument } from 'src/inventory/schema/inventory.schema';
import { AddToCartDto, UpdateCartItemDto } from './dt/cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel('Product')
    private readonly productModel: Model<ProductDocument>,
    @InjectModel('Cart')
    private readonly cartModel: Model<CartDocument>,
    @InjectModel('Inventory')
    private readonly inventoryModel: Model<InventoryDocument>,
  ) {}

  // ── helpers ───────────────────────────────────────────────────────────────────
  private async getOrCreateCart(userId: string) {
    let cart = await this.cartModel.findOne({ userId });
    if (!cart) cart = await this.cartModel.create({ userId, items: [] });
    return cart;
  }

  private async validateVariant(
    productId: string,
    inventoryId: string,
    requestedQty: number,
  ) {
    const product = await this.productModel.findById(productId);
    if (!product || product.status !== 'active')
      throw new NotFoundException('Product not found or unavailable');

    const variant = await this.inventoryModel.findById(inventoryId);
    if (!variant) throw new NotFoundException('Variant not found');
    if (variant.productId.toString() !== productId)
      throw new BadRequestException('Variant does not belong to this product');

    const available = variant.stock - variant.reserved;
    if (available < requestedQty)
      throw new BadRequestException(
        `Only ${available} unit(s) available in stock`,
      );

    return { product, variant };
  }

  // ── Get cart ──────────────────────────────────────────────────────────────────
  async getCart(userId: string) {
    const cart = await this.cartModel
      .findOne({ userId })
      .populate({
        path: 'items.productId',
        select: 'name slug images basePrice status sellerId',
        populate: { path: 'sellerId', select: 'storeName storeSlug' },
      })
      .populate('items.inventoryId', 'size color price stock reserved sku');

    if (!cart) return { items: [], total: 0, itemCount: 0 };

    // Filter out items whose product became unavailable and compute total
    const validItems = cart.items.filter((item) => {
      const product = item.productId as unknown as { status: string } | null;
      return product && product.status === 'active';
    });

    const total = validItems.reduce(
      (sum, item) => sum + item.priceSnapshot * item.quantity,
      0,
    );
    const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);

    return { items: validItems, total, itemCount };
  }

  // ── Add item ──────────────────────────────────────────────────────────────────
  async addToCart(userId: string, input: AddToCartDto) {
    const { variant } = await this.validateVariant(
      input.productId,
      input.inventoryId,
      input.quantity,
    );

    const cart = await this.getOrCreateCart(userId);

    // If same variant already in cart, increment quantity
    const existingIndex = cart.items.findIndex(
      (item) => item.inventoryId.toString() === input.inventoryId,
    );

    if (existingIndex !== -1) {
      const newQty = cart.items[existingIndex].quantity + input.quantity;
      const available = variant.stock - variant.reserved;
      if (newQty > available)
        throw new BadRequestException(
          `Cannot add more. Only ${available} unit(s) available.`,
        );
      cart.items[existingIndex].quantity = newQty;
    } else {
      cart.items.push({
        productId: input.productId as never,
        inventoryId: input.inventoryId as never,
        quantity: input.quantity,
        priceSnapshot: variant.price,
      });
    }

    await cart.save();
    return await this.getCart(userId);
  }

  // ── Update item quantity ──────────────────────────────────────────────────────
  async updateCartItem(
    userId: string,
    inventoryId: string,
    input: UpdateCartItemDto,
  ) {
    const cart = await this.cartModel.findOne({ userId });
    if (!cart) throw new NotFoundException('Cart not found');

    const itemIndex = cart.items.findIndex(
      (item) => item.inventoryId.toString() === inventoryId,
    );
    if (itemIndex === -1) throw new NotFoundException('Item not found in cart');

    const variant = await this.inventoryModel.findById(inventoryId);
    if (!variant) throw new NotFoundException('Variant not found');

    const available = variant.stock - variant.reserved;
    if (input.quantity > available)
      throw new BadRequestException(
        `Only ${available} unit(s) available in stock`,
      );

    cart.items[itemIndex].quantity = input.quantity;
    await cart.save();
    return await this.getCart(userId);
  }

  // ── Remove item ───────────────────────────────────────────────────────────────
  async removeCartItem(userId: string, inventoryId: string) {
    const cart = await this.cartModel.findOne({ userId });
    if (!cart) throw new NotFoundException('Cart not found');

    const exists = cart.items.some(
      (item) => item.inventoryId.toString() === inventoryId,
    );
    if (!exists) throw new NotFoundException('Item not found in cart');

    cart.items = cart.items.filter(
      (item) => item.inventoryId.toString() !== inventoryId,
    );
    await cart.save();
    return await this.getCart(userId);
  }

  // ── Clear cart ────────────────────────────────────────────────────────────────
  async clearCart(userId: string) {
    await this.cartModel.findOneAndUpdate({ userId }, { items: [] });
  }
}
