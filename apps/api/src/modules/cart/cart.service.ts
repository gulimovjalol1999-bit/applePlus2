import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
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
    const item = await this.itemRepo.findOne({
      where: { cartId: cart.id, variantId },
    });
    if (!item) throw new NotFoundException(`Item with variant ${variantId} not in cart`);
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

      for (const sessionItem of sessionCart.items) {
        const existing = userCart.items?.find((i) => i.variantId === sessionItem.variantId);
        if (existing) {
          existing.quantity += sessionItem.quantity;
          await manager.save(CartItem, existing);
        } else {
          const newItem = manager.create(CartItem, {
            cartId: userCart.id,
            variantId: sessionItem.variantId,
            quantity: sessionItem.quantity,
          });
          await manager.save(CartItem, newItem);
        }
      }

      await manager.delete(CartItem, { cartId: sessionCart.id });
      await manager.remove(Cart, sessionCart);
    });

    return this.getCart(userId);
  }

  private async getOrCreate(userId?: string, sessionId?: string): Promise<Cart> {
    if (userId) {
      let cart = await this.cartRepo.findOne({
        where: { userId },
        relations: ['items', 'items.variant', 'items.variant.product'],
      });
      if (!cart) {
        cart = this.cartRepo.create({ userId });
        cart = await this.cartRepo.save(cart);
        cart.items = [];
      }
      return cart;
    }

    if (sessionId) {
      let cart = await this.cartRepo.findOne({
        where: { sessionId },
        relations: ['items', 'items.variant', 'items.variant.product'],
      });
      if (!cart) {
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);
        cart = this.cartRepo.create({ sessionId, expiresAt: expires });
        cart = await this.cartRepo.save(cart);
        cart.items = [];
      }
      return cart;
    }

    const cart = this.cartRepo.create({});
    const saved = await this.cartRepo.save(cart);
    saved.items = [];
    return saved;
  }

  private toDto(cart: Cart): CartResponseDto {
    const items: CartItemResponseDto[] = (cart.items ?? []).map((item) => {
      const v = item.variant;
      const unitPrice = v?.salePrice ? +v.salePrice : (v ? +v.price : 0);
      return {
        id: item.id,
        variantId: item.variantId,
        variantName: v?.name ?? '',
        sku: v?.sku ?? '',
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
