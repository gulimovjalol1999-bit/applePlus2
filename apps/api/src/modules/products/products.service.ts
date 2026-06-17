import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { Category } from '../categories/category.entity';
import { Brand } from '../brands/brand.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { UsedPhoneDetails } from '../inventory/entities/used-phone-details.entity';
import { InventoryService } from '../inventory/inventory.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { ProductStatus } from '../../common/enums/product-status.enum';
import { ProductType } from '../../common/enums/product-type.enum';
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
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,
    @InjectRepository(InventoryItem)
    private readonly inventoryRepo: Repository<InventoryItem>,
    @InjectRepository(UsedPhoneDetails)
    private readonly usedPhoneDetailsRepo: Repository<UsedPhoneDetails>,
    private readonly inventoryService: InventoryService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(
    filter: ProductFilterDto,
  ): Promise<{ data: ProductResponseDto[]; meta: PaginatedMeta }> {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.brand', 'brand')
      .leftJoinAndSelect('p.images', 'images')
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
    if (filter.productType) {
      qb.andWhere('p.product_type = :productType', { productType: filter.productType });
    }

    const usedPhoneFiltersUsed =
      filter.conditionGrade !== undefined ||
      filter.carrierLockStatus !== undefined ||
      filter.warrantyType !== undefined ||
      filter.minBattery !== undefined ||
      filter.maxBattery !== undefined;

    if (usedPhoneFiltersUsed) {
      qb.innerJoin('p.variants', 'filterVariant')
        .innerJoin('inventory_items', 'filterInv', 'filterInv.variant_id = filterVariant.id')
        .innerJoin('used_phone_details', 'filterUpd', 'filterUpd.inventory_item_id = filterInv.id')
        .andWhere('p.product_type = :usedProductType', { usedProductType: ProductType.USED })
        .andWhere('filterUpd.deleted_at IS NULL');

      if (filter.conditionGrade) {
        qb.andWhere('filterUpd.condition_grade = :conditionGrade', {
          conditionGrade: filter.conditionGrade,
        });
      }
      if (filter.carrierLockStatus) {
        qb.andWhere('filterUpd.carrier_lock_status = :carrierLockStatus', {
          carrierLockStatus: filter.carrierLockStatus,
        });
      }
      if (filter.warrantyType) {
        qb.andWhere('filterUpd.warranty_type = :warrantyType', {
          warrantyType: filter.warrantyType,
        });
      }
      if (filter.minBattery !== undefined) {
        qb.andWhere('filterUpd.battery_health_percent >= :minBattery', {
          minBattery: filter.minBattery,
        });
      }
      if (filter.maxBattery !== undefined) {
        qb.andWhere('filterUpd.battery_health_percent <= :maxBattery', {
          maxBattery: filter.maxBattery,
        });
      }
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
    const usedPhoneDetailsMap = await this.loadUsedPhoneDetailsMap(
      products.filter((p) => p.productType === ProductType.USED).map((p) => p.id),
    );

    return {
      data: products.map((p) => this.toDto(p, undefined, usedPhoneDetailsMap)),
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
    const inventoryMap = await this.loadInventoryMap(product.variants ?? []);
    const usedPhoneDetailsMap = await this.loadUsedPhoneDetailsMap(
      product.productType === ProductType.USED ? [product.id] : [],
    );
    return this.toDto(product, inventoryMap, usedPhoneDetailsMap);
  }

  async findBySlug(slug: string): Promise<ProductResponseDto> {
    const product = await this.productRepo.findOne({
      where: { slug, status: ProductStatus.ACTIVE },
      relations: ['category', 'brand', 'variants', 'images'],
    });
    if (!product) throw new NotFoundException(`Product '${slug}' not found`);
    const inventoryMap = await this.loadInventoryMap(product.variants ?? []);
    const usedPhoneDetailsMap = await this.loadUsedPhoneDetailsMap(
      product.productType === ProductType.USED ? [product.id] : [],
    );
    return this.toDto(product, inventoryMap, usedPhoneDetailsMap);
  }

  // Used internally after mutations (no status filter — admin ops work on any status).
  private async loadProductById(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['category', 'brand', 'variants', 'images'],
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    const inventoryMap = await this.loadInventoryMap(product.variants ?? []);
    const usedPhoneDetailsMap = await this.loadUsedPhoneDetailsMap(
      product.productType === ProductType.USED ? [product.id] : [],
    );
    return this.toDto(product, inventoryMap, usedPhoneDetailsMap);
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

    // Slug is frozen after creation: renaming a product must NOT change its slug,
    // otherwise saved/shared links and search-engine indexes break (404 with no redirect).
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

  // ─── Variants ─────────────────────────────────────────────────────────────

  async createVariant(
    productId: string,
    dto: CreateProductVariantDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    try {
      await this.dataSource.transaction(async (manager) => {
        if (dto.isDefault) {
          await manager.update(ProductVariant, { productId }, { isDefault: false });
        }

        const variant = manager.create(ProductVariant, {
          productId,
          sku: dto.sku,
          name: dto.name,
          price: dto.price,
          salePrice: dto.salePrice ?? null,
          attributes: dto.attributes ?? {},
          weightKg: dto.weightKg ?? null,
          isDefault: dto.isDefault ?? false,
          isActive: dto.isActive ?? true,
        });
        const saved = await manager.save(ProductVariant, variant);

        await this.inventoryService.createForVariant(
          saved.id,
          {
            quantity: dto.initialQuantity,
            reorderLevel: dto.reorderLevel,
            warehouseLocation: dto.warehouseLocation,
          },
          manager,
        );
      });
    } catch (err) {
      this.rethrowVariantDbError(err);
    }

    return this.loadProductById(productId);
  }

  async updateVariant(
    productId: string,
    variantId: string,
    dto: UpdateProductVariantDto,
  ): Promise<ProductResponseDto> {
    const variant = await this.variantRepo.findOne({ where: { id: variantId, productId } });
    if (!variant) throw new NotFoundException(`Variant ${variantId} not found`);

    try {
      await this.dataSource.transaction(async (manager) => {
        if (dto.isDefault) {
          await manager.update(ProductVariant, { productId }, { isDefault: false });
        }
        Object.assign(variant, dto);
        await manager.save(ProductVariant, variant);
      });
    } catch (err) {
      this.rethrowVariantDbError(err);
    }

    return this.loadProductById(productId);
  }

  async removeVariant(productId: string, variantId: string): Promise<ProductResponseDto> {
    const variant = await this.variantRepo.findOne({ where: { id: variantId, productId } });
    if (!variant) throw new NotFoundException(`Variant ${variantId} not found`);
    await this.variantRepo.softDelete(variantId);
    return this.loadProductById(productId);
  }

  // ─── Images ───────────────────────────────────────────────────────────────

  async createImage(productId: string, dto: CreateProductImageDto): Promise<ProductResponseDto> {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    await this.dataSource.transaction(async (manager) => {
      if (dto.isPrimary) {
        await manager.update(ProductImage, { productId }, { isPrimary: false });
      }
      const image = manager.create(ProductImage, {
        productId,
        variantId: dto.variantId ?? null,
        url: dto.url,
        altText: dto.altText ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isPrimary: dto.isPrimary ?? false,
      });
      await manager.save(ProductImage, image);
    });

    return this.loadProductById(productId);
  }

  async removeImage(productId: string, imageId: string): Promise<ProductResponseDto> {
    const image = await this.imageRepo.findOne({ where: { id: imageId, productId } });
    if (!image) throw new NotFoundException(`Image ${imageId} not found`);
    await this.imageRepo.delete(imageId);
    return this.loadProductById(productId);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private rethrowDbError(err: unknown): never {
    if (err instanceof QueryFailedError) {
      const code = (err as unknown as { code: string }).code;
      if (code === '23505') throw new ConflictException('A product with this slug already exists');
      if (code === '23503') throw new BadRequestException('Invalid category or brand ID');
    }
    throw err;
  }

  private rethrowVariantDbError(err: unknown): never {
    if (err instanceof QueryFailedError) {
      const code = (err as unknown as { code: string }).code;
      if (code === '23505') throw new ConflictException('A variant with this SKU already exists');
    }
    throw err;
  }

  private async loadInventoryMap(variants: ProductVariant[]): Promise<Map<string, InventoryItem>> {
    if (!variants.length) return new Map();
    const items = await this.inventoryRepo.find({
      where: { variantId: In(variants.map((v) => v.id)) },
    });
    return new Map(items.map((i) => [i.variantId, i]));
  }

  private async loadUsedPhoneDetailsMap(productIds: string[]): Promise<Map<string, UsedPhoneDetails>> {
    if (!productIds.length) return new Map();
    const rows = await this.usedPhoneDetailsRepo
      .createQueryBuilder('upd')
      .innerJoinAndSelect('upd.inventoryItem', 'inv')
      .innerJoinAndSelect('inv.variant', 'variant')
      .where('variant.product_id IN (:...productIds)', { productIds })
      .andWhere('upd.deleted_at IS NULL')
      .getMany();
    return new Map(rows.map((upd) => [upd.inventoryItem.variant.productId, upd]));
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

  private toDto(
    product: Product,
    inventoryMap?: Map<string, InventoryItem>,
    usedPhoneDetailsMap?: Map<string, UsedPhoneDetails>,
  ): ProductResponseDto {
    const category = product.category as Category | undefined;
    const brand = product.brand as Brand | undefined;
    const usedPhoneDetails = usedPhoneDetailsMap?.get(product.id);

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
      productType: product.productType,
      conditionGrade: usedPhoneDetails?.conditionGrade,
      batteryHealthPercent: usedPhoneDetails?.batteryHealthPercent,
      warrantyType: usedPhoneDetails?.warrantyType,
      carrierLockStatus: usedPhoneDetails?.carrierLockStatus,
      includedAccessories: usedPhoneDetails?.includedAccessories,
      region: usedPhoneDetails?.region,
      defects: usedPhoneDetails?.defects,
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
      variants: product.variants?.map((v) => {
        const inv = inventoryMap?.get(v.id);
        return {
          id: v.id,
          sku: v.sku,
          name: v.name,
          price: +v.price,
          salePrice: v.salePrice !== null ? +v.salePrice : null,
          attributes: v.attributes ?? {},
          weightKg: v.weightKg !== null ? +v.weightKg : null,
          isDefault: v.isDefault,
          isActive: v.isActive,
          quantity: inv?.quantity ?? null,
          availableQuantity: inv ? inv.quantity - inv.reservedQuantity : null,
          reorderLevel: inv?.reorderLevel ?? null,
          warehouseLocation: inv?.warehouseLocation ?? null,
        };
      }),
    };
  }
}
