import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryFailedError, Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Product } from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewFilterDto } from './dto/review-filter.dto';
import { PublicReviewResponseDto, ReviewResponseDto } from './dto/review-response.dto';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { PaginatedMeta } from '../../common/dto/base-response.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly repo: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    private readonly dataSource: DataSource,
  ) {}

  // Public listing — always shows only approved reviews.
  async findAll(
    filter: ReviewFilterDto,
  ): Promise<{ data: PublicReviewResponseDto[]; meta: PaginatedMeta }> {
    const qb = this.repo
      .createQueryBuilder('r')
      .where('r.deleted_at IS NULL')
      .andWhere('r.is_approved = true');

    if (filter.productId) {
      qb.andWhere('r.product_id = :productId', { productId: filter.productId });
    }

    const sortCol = filter.sortBy === 'rating' ? 'r.rating' : 'r.created_at';
    qb.orderBy(sortCol, 'DESC');
    qb.skip((filter.page - 1) * filter.limit).take(filter.limit);

    const [reviews, total] = await qb.getManyAndCount();
    return {
      data: reviews.map((r) => this.toPublicDto(r)),
      meta: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }

  // Admin-only listing — shows unapproved reviews pending moderation.
  async findPending(
    filter: ReviewFilterDto,
  ): Promise<{ data: ReviewResponseDto[]; meta: PaginatedMeta }> {
    const qb = this.repo
      .createQueryBuilder('r')
      .where('r.deleted_at IS NULL')
      .andWhere('r.is_approved = false');

    if (filter.productId) {
      qb.andWhere('r.product_id = :productId', { productId: filter.productId });
    }

    qb.orderBy('r.created_at', 'ASC');
    qb.skip((filter.page - 1) * filter.limit).take(filter.limit);

    const [reviews, total] = await qb.getManyAndCount();
    return {
      data: reviews.map((r) => this.toDto(r)),
      meta: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }

  async create(userId: string, dto: CreateReviewDto): Promise<ReviewResponseDto> {
    // Verify the product exists.
    const product = await this.productRepo.findOne({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException(`Product ${dto.productId} not found`);

    // Verify the order exists, belongs to this user, is DELIVERED, and contains this product.
    const order = await this.orderRepo.findOne({
      where: { id: dto.orderId, userId, status: OrderStatus.DELIVERED },
    });
    if (!order) {
      throw new ForbiddenException(
        'You can only review products from your own delivered orders',
      );
    }

    const orderItem = await this.orderItemRepo.findOne({
      where: { orderId: dto.orderId, productId: dto.productId },
    });
    if (!orderItem) {
      throw new ForbiddenException(
        'This product is not part of the specified order',
      );
    }

    // Duplicate check + insert inside a transaction.
    // withDeleted: true ensures soft-deleted rows are found — without this a
    // second review attempt after admin deletion bypasses the app-level check
    // and then crashes on the DB unique constraint with an unhandled 500.
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(Review, {
        where: { userId, productId: dto.productId },
        withDeleted: true,
      });
      if (existing) {
        throw new ConflictException('You have already reviewed this product');
      }

      const review = manager.create(Review, {
        userId,
        productId: dto.productId,
        orderId: dto.orderId,
        rating: dto.rating,
        title: dto.title ?? null,
        body: dto.body ?? null,
        isApproved: false,
      });

      try {
        const saved = await manager.save(Review, review);
        return this.toDto(saved);
      } catch (err) {
        if (err instanceof QueryFailedError) {
          const pgErr = err as unknown as { code: string };
          if (pgErr.code === '23505') {
            throw new ConflictException('You have already reviewed this product');
          }
        }
        throw err;
      }
    });
  }

  // approve() and remove() both write the review AND update product stats.
  // They run inside a transaction so the stats are never left stale on partial failure.
  async approve(id: string): Promise<ReviewResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const review = await manager.findOne(Review, { where: { id } });
      if (!review) throw new NotFoundException(`Review ${id} not found`);

      review.isApproved = true;
      const saved = await manager.save(Review, review);

      await this.recalculateProductStats(manager, review.productId);
      return this.toDto(saved);
    });
  }

  async remove(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const review = await manager.findOne(Review, { where: { id } });
      if (!review) throw new NotFoundException(`Review ${id} not found`);

      await manager.softDelete(Review, id);
      await this.recalculateProductStats(manager, review.productId);
    });
  }

  private async recalculateProductStats(
    manager: EntityManager,
    productId: string,
  ): Promise<void> {
    const result = await manager
      .createQueryBuilder(Review, 'r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.product_id = :productId AND r.is_approved = true AND r.deleted_at IS NULL', {
        productId,
      })
      .getRawOne<{ avg: string; count: string }>();

    const avg = result?.avg ? parseFloat(result.avg) : 0;
    const count = result?.count ? parseInt(result.count, 10) : 0;

    await manager.update(Product, productId, {
      averageRating: +avg.toFixed(2),
      reviewCount: count,
    });
  }

  private toDto(review: Review): ReviewResponseDto {
    return {
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      orderId: review.orderId,
      rating: review.rating,
      title: review.title,
      body: review.body,
      isApproved: review.isApproved,
      createdAt: review.createdAt?.toISOString(),
      updatedAt: review.updatedAt?.toISOString(),
    };
  }

  // userId is omitted from public responses to prevent user identity leakage
  // on the unauthenticated GET /reviews endpoint.
  private toPublicDto(review: Review): PublicReviewResponseDto {
    return {
      id: review.id,
      productId: review.productId,
      orderId: review.orderId,
      rating: review.rating,
      title: review.title,
      body: review.body,
      isApproved: review.isApproved,
      createdAt: review.createdAt?.toISOString(),
      updatedAt: review.updatedAt?.toISOString(),
    };
  }
}
