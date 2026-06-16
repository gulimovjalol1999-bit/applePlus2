import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { SearchQueryDto } from './dto/search-query.dto';
import { ProductResponseDto } from '../products/dto/product-response.dto';
import { PaginatedMeta } from '../../common/dto/base-response.dto';
import { ProductStatus } from '../../common/enums/product-status.enum';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async search(
    query: SearchQueryDto,
  ): Promise<{ data: ProductResponseDto[]; meta: PaginatedMeta }> {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.brand', 'brand')
      .loadRelationCountAndMap('p.variantCount', 'p.variants')
      .where('p.deleted_at IS NULL')
      .andWhere('p.status = :status', { status: ProductStatus.ACTIVE });

    const term = query.q?.trim();
    if (term) {
      const escaped = this.escapeLike(term);
      qb.andWhere(
        '(p.name ILIKE :q OR p.short_description ILIKE :q OR EXISTS (SELECT 1 FROM unnest(p.tags) AS tag WHERE tag ILIKE :qTag))',
        { q: `%${escaped}%`, qTag: escaped },
      );
    }
    if (query.categoryId) {
      qb.andWhere('p.category_id = :categoryId', { categoryId: query.categoryId });
    }
    if (query.brandId) {
      qb.andWhere('p.brand_id = :brandId', { brandId: query.brandId });
    }
    if (query.minPrice !== undefined) {
      qb.andWhere('p.base_price >= :minPrice', { minPrice: query.minPrice });
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('p.base_price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    qb.orderBy('p.average_rating', 'DESC').addOrderBy('p.review_count', 'DESC');
    qb.skip((query.page - 1) * query.limit).take(query.limit);

    const [products, total] = await qb.getManyAndCount();

    return {
      data: products.map((p) => this.toDto(p)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, '\\$&');
  }

  private toDto(p: Product): ProductResponseDto {
    return {
      id: p.id,
      categoryId: p.categoryId,
      categoryName: p.category?.name ?? null,
      brandId: p.brandId,
      brandName: p.brand?.name ?? null,
      name: p.name,
      slug: p.slug,
      description: p.description,
      shortDescription: p.shortDescription,
      basePrice: +p.basePrice,
      salePrice: p.salePrice !== null ? +p.salePrice : null,
      status: p.status,
      productType: p.productType,
      tags: p.tags ?? [],
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      averageRating: +p.averageRating,
      reviewCount: p.reviewCount,
      variantCount: (p as Product & { variantCount?: number }).variantCount
        ?? (p.variants?.length ?? 0),
      createdAt: p.createdAt?.toISOString(),
      updatedAt: p.updatedAt?.toISOString(),
    };
  }
}
