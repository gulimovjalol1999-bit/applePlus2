import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon, CouponType } from './entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { CouponResponseDto, CouponValidationResponseDto } from './dto/coupon-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedMeta } from '../../common/dto/base-response.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly repo: Repository<Coupon>,
  ) {}

  async findAll(
    pagination: PaginationDto,
  ): Promise<{ data: CouponResponseDto[]; meta: PaginatedMeta }> {
    const [coupons, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
    return {
      data: coupons.map((c) => this.toDto(c)),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async findOne(id: string): Promise<CouponResponseDto> {
    const coupon = await this.repo.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon ${id} not found`);
    return this.toDto(coupon);
  }

  async create(dto: CreateCouponDto): Promise<CouponResponseDto> {
    const existing = await this.repo.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Coupon code "${dto.code}" already exists`);

    const coupon = this.repo.create({
      ...dto,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.repo.save(coupon);
    return this.toDto(saved);
  }

  async update(id: string, dto: UpdateCouponDto): Promise<CouponResponseDto> {
    const coupon = await this.repo.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon ${id} not found`);

    if (dto.code && dto.code !== coupon.code) {
      const conflict = await this.repo.findOne({ where: { code: dto.code } });
      if (conflict) throw new ConflictException(`Coupon code "${dto.code}" already exists`);
    }

    Object.assign(coupon, dto);
    await this.repo.save(coupon);
    return this.toDto(coupon);
  }

  async remove(id: string): Promise<void> {
    const coupon = await this.repo.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon ${id} not found`);
    await this.repo.softDelete(id);
  }

  async validate(dto: ValidateCouponDto): Promise<CouponValidationResponseDto> {
    const coupon = await this.repo.findOne({
      where: { code: dto.code, isActive: true },
    });

    if (!coupon) throw new NotFoundException(`Coupon "${dto.code}" not found or inactive`);

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      throw new UnprocessableEntityException('Coupon is not yet active');
    }
    if (coupon.expiresAt && now > coupon.expiresAt) {
      throw new UnprocessableEntityException('Coupon has expired');
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new UnprocessableEntityException('Coupon usage limit reached');
    }
    if (coupon.minOrderAmount !== null && dto.orderAmount < +coupon.minOrderAmount) {
      throw new UnprocessableEntityException(
        `Minimum order amount is $${coupon.minOrderAmount}`,
      );
    }

    let discount: number;
    if (coupon.type === CouponType.PERCENT) {
      const pct = +coupon.value;
      if (pct > 100) {
        throw new UnprocessableEntityException('Invalid percent coupon: value exceeds 100%');
      }
      discount = +(dto.orderAmount * (pct / 100)).toFixed(2);
    } else {
      discount = Math.min(+coupon.value, dto.orderAmount);
    }

    return {
      valid: true,
      discount,
      finalAmount: +(dto.orderAmount - discount).toFixed(2),
    };
  }

  async incrementUsedCount(id: string): Promise<void> {
    await this.repo.increment({ id }, 'usedCount', 1);
  }

  private toDto(coupon: Coupon): CouponResponseDto {
    return {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: +coupon.value,
      minOrderAmount: coupon.minOrderAmount ? +coupon.minOrderAmount : null,
      maxUses: coupon.maxUses,
      usedCount: coupon.usedCount,
      isActive: coupon.isActive,
      startsAt: coupon.startsAt?.toISOString() ?? null,
      expiresAt: coupon.expiresAt?.toISOString() ?? null,
      createdAt: coupon.createdAt.toISOString(),
      updatedAt: coupon.updatedAt.toISOString(),
    };
  }
}
