import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryLog } from './entities/inventory-log.entity';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { InventoryFilterDto } from './dto/inventory-filter.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { InventoryItemDto } from './dto/inventory-item.dto';
import { PaginatedMeta } from '../../common/dto/base-response.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,
    @InjectRepository(InventoryLog)
    private readonly logRepo: Repository<InventoryLog>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(
    filter: InventoryFilterDto,
  ): Promise<{ data: InventoryItemDto[]; meta: PaginatedMeta }> {
    const { page, limit } = filter;
    const qb = this.buildListQuery(filter).skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();

    return {
      data: items.map((i) => this.toDto(i)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByVariant(variantId: string): Promise<InventoryItemDto> {
    const item = await this.itemRepo.findOne({
      where: { variantId },
      relations: ['variant', 'variant.product'],
    });
    if (!item) throw new NotFoundException(`Inventory not found for variant ${variantId}`);
    return this.toDto(item);
  }

  async findLowStock(
    filter: InventoryFilterDto,
  ): Promise<{ data: InventoryItemDto[]; meta: PaginatedMeta }> {
    return this.findAll({ ...filter, lowStock: true });
  }

  async findOutOfStock(
    filter: InventoryFilterDto,
  ): Promise<{ data: InventoryItemDto[]; meta: PaginatedMeta }> {
    return this.findAll({ ...filter, outOfStock: true });
  }

  async adjustStock(
    variantId: string,
    dto: AdjustStockDto,
    performedById: string,
  ): Promise<InventoryItemDto> {
    return this.dataSource.transaction(async (manager) => {
      // Row-level lock prevents concurrent adjustments overselling
      const item = await manager
        .createQueryBuilder(InventoryItem, 'inv')
        .setLock('pessimistic_write')
        .leftJoinAndSelect('inv.variant', 'variant')
        .leftJoinAndSelect('variant.product', 'product')
        .where('inv.variant_id = :variantId', { variantId })
        .getOne();

      if (!item) throw new NotFoundException(`Inventory not found for variant ${variantId}`);

      const newQuantity = item.quantity + dto.adjustment;

      if (newQuantity < item.reservedQuantity) {
        throw new UnprocessableEntityException(
          `Adjustment would bring quantity (${newQuantity}) below reserved quantity (${item.reservedQuantity})`,
        );
      }
      if (newQuantity < 0) {
        throw new UnprocessableEntityException(
          `Adjustment would result in negative quantity (${newQuantity})`,
        );
      }

      const quantityBefore = item.quantity;
      item.quantity = newQuantity;
      await manager.save(InventoryItem, item);

      const log = manager.create(InventoryLog, {
        inventoryItemId: item.id,
        adjustment: dto.adjustment,
        quantityBefore,
        quantityAfter: newQuantity,
        reason: dto.reason,
        performedById,
      });
      await manager.save(InventoryLog, log);

      return this.toDto(item);
    });
  }

  async update(variantId: string, dto: UpdateInventoryDto): Promise<InventoryItemDto> {
    const item = await this.itemRepo.findOne({
      where: { variantId },
      relations: ['variant', 'variant.product'],
    });
    if (!item) throw new NotFoundException(`Inventory not found for variant ${variantId}`);

    if (dto.reorderLevel !== undefined) item.reorderLevel = dto.reorderLevel;
    if (dto.warehouseLocation !== undefined) item.warehouseLocation = dto.warehouseLocation;

    await this.itemRepo.save(item);
    return this.toDto(item);
  }

  // Used by other modules (e.g. orders) to reserve/release/sell stock transactionally.

  async reserveStock(
    variantId: string,
    qty: number,
    manager = this.dataSource.manager,
  ): Promise<void> {
    const item = await manager
      .createQueryBuilder(InventoryItem, 'inv')
      .setLock('pessimistic_write')
      .where('inv.variant_id = :variantId', { variantId })
      .getOne();

    if (!item) throw new NotFoundException(`Inventory not found for variant ${variantId}`);
    if (item.quantity - item.reservedQuantity < qty) {
      throw new UnprocessableEntityException(
        `Insufficient available stock for variant ${variantId}`,
      );
    }

    item.reservedQuantity += qty;
    await manager.save(InventoryItem, item);
  }

  async releaseReservation(
    variantId: string,
    qty: number,
    manager = this.dataSource.manager,
  ): Promise<void> {
    const item = await manager
      .createQueryBuilder(InventoryItem, 'inv')
      .setLock('pessimistic_write')
      .where('inv.variant_id = :variantId', { variantId })
      .getOne();

    if (!item) return;

    item.reservedQuantity = Math.max(0, item.reservedQuantity - qty);
    await manager.save(InventoryItem, item);
  }

  async commitSale(
    variantId: string,
    qty: number,
    manager = this.dataSource.manager,
  ): Promise<void> {
    const item = await manager
      .createQueryBuilder(InventoryItem, 'inv')
      .setLock('pessimistic_write')
      .where('inv.variant_id = :variantId', { variantId })
      .getOne();

    if (!item) throw new NotFoundException(`Inventory not found for variant ${variantId}`);

    item.quantity = Math.max(0, item.quantity - qty);
    item.reservedQuantity = Math.max(0, item.reservedQuantity - qty);
    item.soldCount += qty;
    await manager.save(InventoryItem, item);
  }

  // ─── helpers ──────────────────────────────────────────────────────────────

  private buildListQuery(filter: InventoryFilterDto): SelectQueryBuilder<InventoryItem> {
    const qb = this.itemRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product');

    if (filter.search) {
      qb.andWhere(
        '(variant.sku ILIKE :search OR product.name ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    if (filter.categoryId) {
      qb.andWhere('product.category_id = :categoryId', { categoryId: filter.categoryId });
    }

    if (filter.brandId) {
      qb.andWhere('product.brand_id = :brandId', { brandId: filter.brandId });
    }

    if (filter.lowStock) {
      qb.andWhere('inv.quantity <= inv.reorder_level');
    }

    if (filter.outOfStock) {
      qb.andWhere('(inv.quantity - inv.reserved_quantity) = 0');
    }

    const sortMap: Record<string, string> = {
      quantity: 'inv.quantity',
      sku: 'variant.sku',
      updatedAt: 'inv.updatedAt',
    };
    const orderCol = sortMap[filter.sortBy ?? 'updatedAt'] ?? 'inv.updatedAt';
    qb.orderBy(orderCol, 'DESC');

    return qb;
  }

  private toDto(item: InventoryItem): InventoryItemDto {
    const variant = item.variant;
    const product = variant?.product as import('../products/entities/product.entity').Product | undefined;

    return {
      id: item.id,
      variantId: item.variantId,
      sku: variant?.sku ?? '',
      variantName: variant?.name ?? '',
      productId: variant?.productId ?? '',
      productName: product?.name ?? '',
      quantity: item.quantity,
      reservedQuantity: item.reservedQuantity,
      availableQuantity: item.quantity - item.reservedQuantity,
      soldCount: item.soldCount,
      reorderLevel: item.reorderLevel,
      warehouseLocation: item.warehouseLocation,
      updatedAt: item.updatedAt?.toISOString(),
    };
  }
}
