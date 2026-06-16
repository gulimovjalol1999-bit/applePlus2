import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { ProductStatus } from '../../common/enums/product-status.enum';
import { ProductType } from '../../common/enums/product-type.enum';
import { PaginatedMeta } from '../../common/dto/base-response.dto';
import { toSlug } from '../../common/utils/slug.util';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { ProductImage } from '../products/entities/product-image.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { InventoryEventType, InventoryLog } from '../inventory/entities/inventory-log.entity';
import { UsedPhoneDetails } from '../inventory/entities/used-phone-details.entity';
import { InventoryService } from '../inventory/inventory.service';
import { CreateUsedPhoneDto } from './dto/create-used-phone.dto';
import { MarkUsedPhoneSoldResponseDto } from './dto/mark-used-phone-sold-response.dto';
import { UpdateUsedPhoneDto } from './dto/update-used-phone.dto';
import { UsedPhoneFilterDto } from './dto/used-phone-filter.dto';
import { UsedPhoneResponseDto } from './dto/used-phone-response.dto';

const MAX_SLUG_ATTEMPTS = 100;

@Injectable()
export class UsedPhonesService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(UsedPhoneDetails)
    private readonly usedPhoneDetailsRepo: Repository<UsedPhoneDetails>,
    private readonly inventoryService: InventoryService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(
    filter: UsedPhoneFilterDto,
  ): Promise<{ data: UsedPhoneResponseDto[]; meta: PaginatedMeta }> {
    const qb = this.usedPhoneDetailsRepo
      .createQueryBuilder('upd')
      .innerJoinAndSelect('upd.inventoryItem', 'inv')
      .innerJoinAndSelect('inv.variant', 'variant')
      .innerJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.deleted_at IS NULL')
      .andWhere('variant.deleted_at IS NULL')
      .andWhere('upd.deleted_at IS NULL')
      .andWhere('product.product_type = :productType', { productType: ProductType.USED });

    if (filter.status) {
      qb.andWhere('product.status = :status', { status: filter.status });
    }

    if (filter.search) {
      qb.andWhere(
        '(product.name ILIKE :search OR upd.imei ILIKE :search OR upd.serial_number ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }
    if (filter.brandId) {
      qb.andWhere('product.brand_id = :brandId', { brandId: filter.brandId });
    }
    if (filter.categoryId) {
      qb.andWhere('product.category_id = :categoryId', { categoryId: filter.categoryId });
    }
    if (filter.conditionGrade) {
      qb.andWhere('upd.condition_grade = :conditionGrade', { conditionGrade: filter.conditionGrade });
    }
    if (filter.carrierLockStatus) {
      qb.andWhere('upd.carrier_lock_status = :carrierLockStatus', {
        carrierLockStatus: filter.carrierLockStatus,
      });
    }
    if (filter.warrantyType) {
      qb.andWhere('upd.warranty_type = :warrantyType', { warrantyType: filter.warrantyType });
    }
    if (filter.minPrice !== undefined) {
      qb.andWhere('variant.price >= :minPrice', { minPrice: filter.minPrice });
    }
    if (filter.maxPrice !== undefined) {
      qb.andWhere('variant.price <= :maxPrice', { maxPrice: filter.maxPrice });
    }
    if (filter.minBattery !== undefined) {
      qb.andWhere('upd.battery_health_percent >= :minBattery', { minBattery: filter.minBattery });
    }
    if (filter.maxBattery !== undefined) {
      qb.andWhere('upd.battery_health_percent <= :maxBattery', { maxBattery: filter.maxBattery });
    }

    const sortCol: Record<string, string> = {
      price: 'variant.price',
      createdAt: 'product.createdAt',
      batteryHealthPercent: 'upd.batteryHealthPercent',
    };
    qb.orderBy(sortCol[filter.sortBy ?? 'createdAt'] ?? 'product.createdAt', filter.sortOrder ?? 'DESC');

    const offset = (filter.page - 1) * filter.limit;
    qb.skip(offset).take(filter.limit);

    const [rows, total] = await qb.getManyAndCount();

    return {
      data: rows.map((upd) => this.toDto(upd)),
      meta: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }

  async findOne(id: string): Promise<UsedPhoneResponseDto> {
    const upd = await this.loadByProductId(id);
    return this.toDto(upd);
  }

  async create(dto: CreateUsedPhoneDto, createdById?: string): Promise<UsedPhoneResponseDto> {
    const slug = await this.uniqueSlug(dto.name);

    let productId: string;
    try {
      productId = await this.dataSource.transaction(async (manager) => {
        const product = manager.create(Product, {
          categoryId: dto.categoryId,
          brandId: dto.brandId,
          name: dto.name,
          slug,
          description: dto.description ?? null,
          basePrice: dto.price,
          status: ProductStatus.ACTIVE,
          productType: ProductType.USED,
          tags: [],
          createdById: createdById ?? null,
          updatedById: createdById ?? null,
        });
        const savedProduct = await manager.save(Product, product);

        if (dto.images?.length) {
          const images = dto.images.map((img, idx) =>
            manager.create(ProductImage, {
              productId: savedProduct.id,
              url: img.url,
              altText: img.altText ?? null,
              sortOrder: img.sortOrder ?? idx,
              isPrimary: img.isPrimary ?? idx === 0,
            }),
          );
          await manager.save(ProductImage, images);
        }

        const variant = manager.create(ProductVariant, {
          productId: savedProduct.id,
          sku: dto.sku,
          name: dto.name,
          price: dto.price,
          attributes: dto.attributes ?? {},
          isDefault: true,
          isActive: true,
        });
        const savedVariant = await manager.save(ProductVariant, variant);

        // A used phone is a single physical unit identified by its IMEI, so
        // quantity is always exactly 1 (markSold relies on this invariant).
        const savedInventory = await this.inventoryService.createForVariant(
          savedVariant.id,
          { quantity: 1, reorderLevel: 0 },
          manager,
        );

        const usedPhoneDetails = manager.create(UsedPhoneDetails, {
          inventoryItemId: savedInventory.id,
          imei: dto.imei,
          imei2: dto.imei2 ?? null,
          serialNumber: dto.serialNumber ?? null,
          conditionGrade: dto.conditionGrade,
          batteryHealthPercent: dto.batteryHealthPercent,
          defects: dto.defects ?? [],
          repairHistory: dto.repairHistory ?? [],
          includedAccessories: dto.includedAccessories ?? [],
          warrantyType: dto.warrantyType,
          warrantyExpiresAt: dto.warrantyExpiresAt ? new Date(dto.warrantyExpiresAt) : null,
          carrierLockStatus: dto.carrierLockStatus,
          region: dto.region ?? null,
          purchaseCostPrice: dto.purchaseCostPrice,
          gradeNotes: dto.gradeNotes ?? null,
        });
        await manager.save(UsedPhoneDetails, usedPhoneDetails);

        return savedProduct.id;
      });
    } catch (err) {
      return this.rethrowDbError(err);
    }

    return this.findOne(productId);
  }

  async update(id: string, dto: UpdateUsedPhoneDto): Promise<UsedPhoneResponseDto> {
    const upd = await this.loadByProductId(id);
    const product = upd.inventoryItem.variant.product;
    const variant = upd.inventoryItem.variant;

    try {
      await this.dataSource.transaction(async (manager) => {
        if (dto.name !== undefined && dto.name !== product.name) {
          product.slug = await this.uniqueSlug(dto.name, product.id);
          product.name = dto.name;
          variant.name = dto.name;
        }
        if (dto.categoryId !== undefined) product.categoryId = dto.categoryId;
        if (dto.brandId !== undefined) product.brandId = dto.brandId;
        if (dto.description !== undefined) product.description = dto.description;
        if (dto.price !== undefined) {
          product.basePrice = dto.price;
          variant.price = dto.price;
        }
        await manager.save(Product, product);

        if (dto.sku !== undefined) variant.sku = dto.sku;
        if (dto.attributes !== undefined) variant.attributes = dto.attributes;
        await manager.save(ProductVariant, variant);

        if (dto.images !== undefined) {
          await manager.delete(ProductImage, { productId: product.id });
          if (dto.images.length) {
            const images = dto.images.map((img, idx) =>
              manager.create(ProductImage, {
                productId: product.id,
                url: img.url,
                altText: img.altText ?? null,
                sortOrder: img.sortOrder ?? idx,
                isPrimary: img.isPrimary ?? idx === 0,
              }),
            );
            await manager.save(ProductImage, images);
          }
        }

        if (dto.imei !== undefined) upd.imei = dto.imei;
        if (dto.imei2 !== undefined) upd.imei2 = dto.imei2;
        if (dto.serialNumber !== undefined) upd.serialNumber = dto.serialNumber;
        if (dto.conditionGrade !== undefined) upd.conditionGrade = dto.conditionGrade;
        if (dto.batteryHealthPercent !== undefined) upd.batteryHealthPercent = dto.batteryHealthPercent;
        if (dto.defects !== undefined) upd.defects = dto.defects;
        if (dto.repairHistory !== undefined) upd.repairHistory = dto.repairHistory;
        if (dto.includedAccessories !== undefined) upd.includedAccessories = dto.includedAccessories;
        if (dto.warrantyType !== undefined) upd.warrantyType = dto.warrantyType;
        if (dto.warrantyExpiresAt !== undefined) {
          upd.warrantyExpiresAt = dto.warrantyExpiresAt ? new Date(dto.warrantyExpiresAt) : null;
        }
        if (dto.carrierLockStatus !== undefined) upd.carrierLockStatus = dto.carrierLockStatus;
        if (dto.region !== undefined) upd.region = dto.region;
        if (dto.purchaseCostPrice !== undefined) upd.purchaseCostPrice = dto.purchaseCostPrice;
        if (dto.gradeNotes !== undefined) upd.gradeNotes = dto.gradeNotes;
        await manager.save(UsedPhoneDetails, upd);
      });
    } catch (err) {
      return this.rethrowDbError(err);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const upd = await this.loadByProductId(id);
    await this.dataSource.transaction(async (manager) => {
      await manager.softDelete(Product, upd.inventoryItem.variant.product.id);
      await manager.softDelete(UsedPhoneDetails, upd.id);
    });
  }

  // Used phones are unique (1 IMEI = 1 unit), so a sale always exhausts the
  // listing entirely. The product is archived rather than left active with
  // zero quantity, since there is no future restock to wait for and an
  // active-but-out-of-stock listing for a unique item would just confuse
  // storefront browsing/search. Archiving keeps the record (and its sale
  // history) intact for reporting without surfacing it to customers.
  async markSold(id: string): Promise<MarkUsedPhoneSoldResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const upd = await manager
        .createQueryBuilder(UsedPhoneDetails, 'upd')
        .setLock('pessimistic_write')
        .innerJoinAndSelect('upd.inventoryItem', 'inv')
        .innerJoinAndSelect('inv.variant', 'variant')
        .innerJoinAndSelect('variant.product', 'product')
        .where('product.id = :id', { id })
        .andWhere('product.deleted_at IS NULL')
        .andWhere('variant.deleted_at IS NULL')
        .andWhere('upd.deleted_at IS NULL')
        .andWhere('product.product_type = :productType', { productType: ProductType.USED })
        .getOne();

      if (!upd) throw new NotFoundException(`Used phone ${id} not found`);

      if (upd.soldAt) {
        throw new ConflictException('This used phone has already been marked as sold');
      }

      const item = upd.inventoryItem;
      if (item.reservedQuantity > 0) {
        throw new ConflictException(
          'Cannot mark as sold while this item has an active reservation',
        );
      }

      const quantityBefore = item.quantity;
      item.quantity = 0;
      item.soldCount += quantityBefore;
      await manager.save(InventoryItem, item);

      await manager.save(
        InventoryLog,
        manager.create(InventoryLog, {
          inventoryItemId: item.id,
          eventType: InventoryEventType.MANUAL,
          adjustment: -quantityBefore,
          quantityBefore,
          quantityAfter: 0,
          reason: 'Marked as sold',
          performedById: null,
        }),
      );

      const soldAt = new Date();
      upd.soldAt = soldAt;
      await manager.save(UsedPhoneDetails, upd);

      const product = item.variant.product;
      product.status = ProductStatus.ARCHIVED;
      await manager.save(Product, product);

      return {
        productId: product.id,
        inventoryId: item.id,
        sold: true,
        soldAt: soldAt.toISOString(),
      };
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async loadByProductId(id: string): Promise<UsedPhoneDetails> {
    const upd = await this.usedPhoneDetailsRepo
      .createQueryBuilder('upd')
      .innerJoinAndSelect('upd.inventoryItem', 'inv')
      .innerJoinAndSelect('inv.variant', 'variant')
      .innerJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.id = :id', { id })
      .andWhere('product.deleted_at IS NULL')
      .andWhere('variant.deleted_at IS NULL')
      .andWhere('upd.deleted_at IS NULL')
      .andWhere('product.product_type = :productType', { productType: ProductType.USED })
      .getOne();

    if (!upd) throw new NotFoundException(`Used phone ${id} not found`);
    return upd;
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
    return `${base}-${Date.now()}`;
  }

  private rethrowDbError(err: unknown): never {
    if (err instanceof QueryFailedError) {
      const code = (err as unknown as { code: string }).code;
      const detail = (err as unknown as { detail?: string }).detail ?? '';
      if (code === '23505') {
        const constraint = (err as unknown as { constraint?: string }).constraint ?? '';
        if (detail.includes('imei') || constraint.includes('imei')) {
          throw new ConflictException('A used phone with this IMEI already exists');
        }
        if (detail.includes('sku')) throw new ConflictException('A product with this SKU already exists');
        throw new ConflictException('A record with this value already exists');
      }
      if (code === '23503') throw new BadRequestException('Invalid category or brand ID');
      if (code === '23514') throw new BadRequestException('Invalid quantity for current reservations');
    }
    throw err;
  }

  private toDto(upd: UsedPhoneDetails): UsedPhoneResponseDto {
    const inventoryItem = upd.inventoryItem;
    const variant = inventoryItem.variant;
    const product = variant.product;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      status: product.status,
      categoryId: product.categoryId,
      categoryName: product.category?.name ?? null,
      brandId: product.brandId,
      brandName: product.brand?.name ?? null,
      images: (product.images ?? []).map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        sortOrder: img.sortOrder,
        isPrimary: img.isPrimary,
        variantId: img.variantId,
      })),
      variantId: variant.id,
      sku: variant.sku,
      price: +variant.price,
      salePrice: variant.salePrice !== null ? +variant.salePrice : null,
      attributes: variant.attributes ?? {},
      quantity: inventoryItem.quantity,
      availableQuantity: inventoryItem.quantity - inventoryItem.reservedQuantity,
      soldCount: inventoryItem.soldCount,
      imei: upd.imei,
      imei2: upd.imei2,
      serialNumber: upd.serialNumber,
      conditionGrade: upd.conditionGrade,
      batteryHealthPercent: upd.batteryHealthPercent,
      defects: upd.defects ?? [],
      repairHistory: upd.repairHistory ?? [],
      includedAccessories: upd.includedAccessories ?? [],
      warrantyType: upd.warrantyType,
      warrantyExpiresAt: upd.warrantyExpiresAt ? upd.warrantyExpiresAt.toISOString() : null,
      carrierLockStatus: upd.carrierLockStatus,
      region: upd.region,
      purchaseCostPrice: +upd.purchaseCostPrice,
      gradeNotes: upd.gradeNotes,
      soldAt: upd.soldAt ? upd.soldAt.toISOString() : null,
      createdAt: product.createdAt?.toISOString(),
      updatedAt: product.updatedAt?.toISOString(),
    };
  }
}
