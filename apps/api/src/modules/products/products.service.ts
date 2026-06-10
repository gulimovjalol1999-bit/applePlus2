import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Category } from '../categories/category.entity';
import { Brand } from '../brands/brand.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { ProductStatus } from '../../common/enums/product-status.enum';
import { PaginatedMeta } from '../../common/dto/base-response.dto';
import { toSlug } from '../../common/utils/slug.util';

const MAX_SLUG_ATTEMPTS = 100;

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(
    filter: ProductFilterDto,
  ): Promise<{ data: ProductResponseDto[]; meta: PaginatedMeta }> {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.brand', 'brand')
      .loadRelationCountAndMap('p.variantCount', 'p.variants')
      .where('p.deleted_at IS NULL');

    if (filter.search) {
      qb.andWhere(
        '(p.name ILIKE :search OR p.slug ILIKE :search OR :searchTag = ANY(p.tags))',
        { search: `%${filter.search}%`, searchTag: filter.search },
      );
    }
    if (filter.categoryId) {
      qb.andWhere('p.category_id = :categoryId', { categoryId: filter.categoryId });
    }
    if (filter.brandId) {
      qb.andWhere('p.brand_id = :brandId', { brandId: filter.brandId });
    }
    // Always filter by status — default to ACTIVE so unauthenticated callers
    // cannot enumerate DRAFT / ARCHIVED products via the public list endpoint.
    qb.andWhere('p.status = :status', {
      status: filter.status ?? ProductStatus.ACTIVE,
    });

    const sortCol: Record<string, string> = {
      name: 'p.name',
      basePrice: 'p.basePrice',
      createdAt: 'p.createdAt',
      averageRating: 'p.averageRating',
    };
    qb.orderBy(
      sortCol[filter.sortBy ?? 'createdAt'] ?? 'p.createdAt',
      filter.sortOrder ?? 'DESC',
    );

    const offset = (filter.page - 1) * filter.limit;
    qb.skip(offset).take(filter.limit);

    const [products, total] = await qb.getManyAndCount();

    return {
      data: products.map((p) => this.toDto(p)),
      meta: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepo.findOne({
      where: { id, status: ProductStatus.ACTIVE },
      relations: ['category', 'brand', 'variants', 'images'],
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return this.toDto(product);
  }

  async findBySlug(slug: string): Promise<ProductResponseDto> {
    const product = await this.productRepo.findOne({
      where: { slug, status: ProductStatus.ACTIVE },
      relations: ['category', 'brand', 'variants', 'images'],
    });
    if (!product) throw new NotFoundException(`Product '${slug}' not found`);
    return this.toDto(product);
  }

  // Used internally after mutations (no status filter — admin ops work on any status).
  private async loadProductById(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['category', 'brand', 'variants', 'images'],
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return this.toDto(product);
  }

  async create(dto: CreateProductDto, createdById?: string): Promise<ProductResponseDto> {
    const slug = await this.uniqueSlug(dto.name);
    const product = this.productRepo.create({
      ...dto,
      slug,
      status: dto.status ?? ProductStatus.DRAFT,
      tags: dto.tags ?? [],
      createdById: createdById ?? null,
      updatedById: createdById ?? null,
    });
    try {
      const saved = await this.productRepo.save(product);
      return this.loadProductById(saved.id);
    } catch (err) {
      return this.rethrowDbError(err);
    }
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    updatedById?: string,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);

    if (dto.name && dto.name !== product.name) {
      product.slug = await this.uniqueSlug(dto.name, id);
    }

    Object.assign(product, {
      ...dto,
      updatedById: updatedById ?? product.updatedById,
    });

    try {
      await this.productRepo.save(product);
    } catch (err) {
      return this.rethrowDbError(err);
    }
    return this.loadProductById(id);
  }

  async updateStatus(id: string, status: ProductStatus): Promise<ProductResponseDto> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    product.status = status;
    await this.productRepo.save(product);
    return this.loadProductById(id);
  }

  async remove(id: string): Promise<void> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    await this.productRepo.softDelete(id);
  }

  private rethrowDbError(err: unknown): never {
    if (err instanceof QueryFailedError) {
      const code = (err as unknown as { code: string }).code;
      if (code === '23505') throw new ConflictException('A product with this slug already exists');
      if (code === '23503') throw new BadRequestException('Invalid category or brand ID');
    }
    throw err;
  }

  private async uniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = toSlug(name);
    for (let i = 0; i < MAX_SLUG_ATTEMPTS; i++) {
      const slug = i === 0 ? base : `${base}-${i}`;
      const qb = this.productRepo
        .createQueryBuilder('p')
        .where('p.slug = :slug', { slug })
        .withDeleted();
      if (excludeId) qb.andWhere('p.id != :excludeId', { excludeId });
      const exists = await qb.getExists();
      if (!exists) return slug;
    }
    // Fallback: append random suffix so we never throw on heavy bulk imports
    return `${base}-${Date.now()}`;
  }

  private toDto(product: Product): ProductResponseDto {
    const category = product.category as Category | undefined;
    const brand = product.brand as Brand | undefined;

    return {
      id: product.id,
      categoryId: product.categoryId,
      categoryName: category?.name ?? null,
      brandId: product.brandId,
      brandName: brand?.name ?? null,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      basePrice: +product.basePrice,
      salePrice: product.salePrice !== null ? +product.salePrice : null,
      status: product.status,
      tags: product.tags ?? [],
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      averageRating: +product.averageRating,
      reviewCount: product.reviewCount,
      variantCount: (product as Product & { variantCount?: number }).variantCount
        ?? (product.variants?.length ?? 0),
      createdAt: product.createdAt?.toISOString(),
      updatedAt: product.updatedAt?.toISOString(),
      images: product.images?.map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        sortOrder: img.sortOrder,
        isPrimary: img.isPrimary,
        variantId: img.variantId,
      })),
      variants: product.variants?.map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        price: +v.price,
        salePrice: v.salePrice !== null ? +v.salePrice : null,
        attributes: v.attributes ?? {},
        isDefault: v.isDefault,
        isActive: v.isActive,
      })),
    };
  }
}
