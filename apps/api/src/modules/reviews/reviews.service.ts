import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Product } from '../products/entities/product.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewFilterDto } from './dto/review-filter.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { PaginatedMeta } from '../../common/dto/base-response.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly repo: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(
    filter: ReviewFilterDto,
  ): Promise<{ data: ReviewResponseDto[]; meta: PaginatedMeta }> {
    const qb = this.repo
      .createQueryBuilder('r')
      .where('r.deleted_at IS NULL');

    if (filter.productId) {
      qb.andWhere('r.product_id = :productId', { productId: filter.productId });
    }
    if (filter.isApproved !== undefined) {
      qb.andWhere('r.is_approved = :isApproved', { isApproved: filter.isApproved });
    }

    const sortCol = filter.sortBy === 'rating' ? 'r.rating' : 'r.created_at';
    qb.orderBy(sortCol, 'DESC');
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
    const product = await this.productRepo.findOne({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException(`Product ${dto.productId} not found`);

    const existing = await this.repo.findOne({
      where: { userId, productId: dto.productId },
    });
    if (existing) throw new ConflictException('You have already reviewed this product');

    const review = this.repo.create({
      userId,
      productId: dto.productId,
      rating: dto.rating,
      title: dto.title ?? null,
      body: dto.body ?? null,
      isApproved: false,
    });
    await this.repo.save(review);
    return this.toDto(review);
  }

  async approve(id: string): Promise<ReviewResponseDto> {
    const review = await this.repo.findOne({ where: { id } });
    if (!review) throw new NotFoundException(`Review ${id} not found`);
    review.isApproved = true;
    await this.repo.save(review);
    await this.recalculateProduct(review.productId);
    return this.toDto(review);
  }

  async remove(id: string): Promise<void> {
    const review = await this.repo.findOne({ where: { id } });
    if (!review) throw new NotFoundException(`Review ${id} not found`);
    await this.repo.softDelete(id);
    await this.recalculateProduct(review.productId);
  }

  private async recalculateProduct(productId: string): Promise<void> {
    const result = await this.repo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.product_id = :productId AND r.is_approved = true AND r.deleted_at IS NULL', { productId })
      .getRawOne<{ avg: string; count: string }>();

    const avg = result?.avg ? parseFloat(result.avg) : 0;
    const count = result?.count ? parseInt(result.count, 10) : 0;

    await this.productRepo.update(productId, {
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
}
