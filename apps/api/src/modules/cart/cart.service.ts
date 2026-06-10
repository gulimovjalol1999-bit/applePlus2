import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto, CartItemResponseDto } from './dto/cart-response.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly itemRepo: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(InventoryItem)
    private readonly inventoryRepo: Repository<InventoryItem>,
    private readonly dataSource: DataSource,
  ) {}

  async getCart(userId?: string, sessionId?: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreate(userId, sessionId);
    return this.toDto(cart);
  }

  async addItem(dto: AddToCartDto, userId?: string, sessionId?: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreate(userId, sessionId);

    const existing = await this.itemRepo.findOne({
      where: { cartId: cart.id, variantId: dto.variantId },
    });
    const existingQty = existing?.quantity ?? 0;

    await this.validateVariantAndStock(dto.variantId, existingQty + dto.quantity);

    if (existing) {
      existing.quantity += dto.quantity;
      await this.itemRepo.save(existing);
    } else {
      const item = this.itemRepo.create({
        cartId: cart.id,
        variantId: dto.variantId,
        quantity: dto.quantity,
      });
      await this.itemRepo.save(item);
    }

    return this.getCart(userId, sessionId);
  }

  async updateItem(
    variantId: string,
    dto: UpdateCartItemDto,
    userId?: string,
    sessionId?: string,
  ): Promise<CartResponseDto> {
    const cart = await this.getOrCreate(userId, sessionId);
    const item = await this.itemRepo.findOne({ where: { cartId: cart.id, variantId } });
    if (!item) throw new NotFoundException(`Item with variant ${variantId} not in cart`);

    await this.validateVariantAndStock(variantId, dto.quantity);

    item.quantity = dto.quantity;
    await this.itemRepo.save(item);
    return this.getCart(userId, sessionId);
  }

  async removeItem(variantId: string, userId?: string, sessionId?: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreate(userId, sessionId);
    await this.itemRepo.delete({ cartId: cart.id, variantId });
    return this.getCart(userId, sessionId);
  }

  async clearCart(userId?: string, sessionId?: string): Promise<void> {
    const cart = await this.getOrCreate(userId, sessionId);
    await this.itemRepo.delete({ cartId: cart.id });
  }

  async mergeSessionCart(userId: string, sessionId: string): Promise<CartResponseDto> {
    await this.dataSource.transaction(async (manager) => {
      const sessionCart = await manager.findOne(Cart, {
        where: { sessionId },
        relations: ['items'],
      });
      if (!sessionCart) return;

      let userCart = await manager.findOne(Cart, {
        where: { userId },
        relations: ['items'],
      });
      if (!userCart) {
        userCart = manager.create(Cart, { userId });
        userCart = await manager.save(Cart, userCart);
      }

      // Cart is an untrusted layer: quantities are capped to available stock at merge time.
      // The authoritative stock check still happens at order creation (with row-level lock).
      for (const sessionItem of sessionCart.items) {
        const inv = await manager.findOne(InventoryItem, {
          where: { variantId: sessionItem.variantId },
        });
        const available = inv ? inv.quantity - inv.reservedQuantity : 0;

        const existing = userCart.items?.find((i) => i.variantId === sessionItem.variantId);
        const existingQty = existing?.quantity ?? 0;

        // Only add up to what's actually available beyond what's already in the user cart.
        const qtyToAdd = Math.min(sessionItem.quantity, Math.max(0, available - existingQty));
        if (qtyToAdd <= 0) continue;

        if (existing) {
          existing.quantity = existingQty + qtyToAdd;
          await manager.save(CartItem, existing);
        } else {
          const newItem = manager.create(CartItem, {
            cartId: userCart.id,
            variantId: sessionItem.variantId,
            quantity: qtyToAdd,
          });
          await manager.save(CartItem, newItem);
        }
      }

      await manager.delete(CartItem, { cartId: sessionCart.id });
      await manager.remove(Cart, sessionCart);
    });

    return this.getCart(userId);
  }

  // ─── private helpers ──────────────────────────────────────────────────────

  private async validateVariantAndStock(variantId: string, requestedQty: number): Promise<void> {
    const variant = await this.variantRepo.findOne({
      where: { id: variantId, isActive: true },
    });
    if (!variant) {
      throw new NotFoundException(`Variant ${variantId} not found or inactive`);
    }

    const inventory = await this.inventoryRepo.findOne({ where: { variantId } });
    const available = inventory ? inventory.quantity - inventory.reservedQuantity : 0;
    if (requestedQty > available) {
      throw new UnprocessableEntityException(
        `Only ${available} unit(s) available for this variant`,
      );
    }
  }

  private async getOrCreate(userId?: string, sessionId?: string): Promise<Cart> {
    if (!userId && !sessionId) {
      throw new BadRequestException('Either userId or sessionId must be provided');
    }

    if (userId) {
      let cart = await this.cartRepo.findOne({
        where: { userId },
        relations: ['items', 'items.variant', 'items.variant.product', 'items.variant.images'],
      });
      if (!cart) {
        cart = this.cartRepo.create({ userId });
        cart = await this.cartRepo.save(cart);
        cart.items = [];
      }
      return cart;
    }

    let cart = await this.cartRepo.findOne({
      where: { sessionId },
      relations: ['items', 'items.variant', 'items.variant.product', 'items.variant.images'],
    });
    if (!cart) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      cart = this.cartRepo.create({ sessionId, expiresAt });
      cart = await this.cartRepo.save(cart);
      cart.items = [];
    }
    return cart;
  }

  private toDto(cart: Cart): CartResponseDto {
    const items: CartItemResponseDto[] = (cart.items ?? []).map((item) => {
      const v = item.variant;
      const product = v?.product;
      const unitPrice = v?.salePrice ? +v.salePrice : (v ? +v.price : 0);
      const primaryImage = v?.images?.find((img) => img.isPrimary) ?? v?.images?.[0];

      return {
        id: item.id,
        variantId: item.variantId,
        productId: product?.id ?? '',
        productName: product?.name ?? '',
        variantName: v?.name ?? '',
        sku: v?.sku ?? '',
        imageUrl: primaryImage?.url ?? null,
        price: v ? +v.price : 0,
        salePrice: v?.salePrice ? +v.salePrice : null,
        quantity: item.quantity,
        lineTotal: +(unitPrice * item.quantity).toFixed(2),
      };
    });

    const subtotal = +items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2);

    return {
      id: cart.id,
      items,
      subtotal,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    };
  }
}
