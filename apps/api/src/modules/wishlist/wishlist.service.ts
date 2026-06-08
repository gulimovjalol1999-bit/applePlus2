import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './entities/wishlist-item.entity';
import { WishlistItemResponseDto } from './dto/wishlist-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedMeta } from '../../common/dto/base-response.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private readonly repo: Repository<WishlistItem>,
  ) {}

  async findByUser(
    userId: string,
    pagination: PaginationDto,
  ): Promise<{ data: WishlistItemResponseDto[]; meta: PaginatedMeta }> {
    const [items, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return {
      data: items.map((i) => this.toDto(i)),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async addItem(userId: string, productId: string): Promise<WishlistItemResponseDto> {
    const existing = await this.repo.findOne({ where: { userId, productId } });
    if (existing) throw new ConflictException('Product already in wishlist');

    const item = this.repo.create({ userId, productId });
    const saved = await this.repo.save(item);
    const full = await this.repo.findOne({ where: { id: saved.id } });
    if (!full) throw new NotFoundException('Wishlist item not found after save');
    return this.toDto(full);
  }

  async removeItem(userId: string, productId: string): Promise<void> {
    const item = await this.repo.findOne({ where: { userId, productId } });
    if (!item) throw new NotFoundException('Product not in wishlist');
    await this.repo.remove(item);
  }

  async isInWishlist(userId: string, productId: string): Promise<{ inWishlist: boolean }> {
    const exists = await this.repo.exists({ where: { userId, productId } });
    return { inWishlist: exists };
  }

  private toDto(item: WishlistItem): WishlistItemResponseDto {
    return {
      id: item.id,
      productId: item.productId,
      productName: item.product?.name ?? '',
      productSlug: item.product?.slug ?? '',
      basePrice: item.product ? +item.product.basePrice : 0,
      createdAt: item.createdAt?.toISOString(),
    };
  }
}
