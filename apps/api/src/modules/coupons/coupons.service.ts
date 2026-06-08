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
    const existing = await this.repo.findOne({ where: { code: dto.code.toUpperCase() } });
    if (existing) throw new ConflictException(`Coupon code "${dto.code}" already exists`);

    const coupon = this.repo.create({
      ...dto,
      code: dto.code.toUpperCase(),
      isActive: dto.isActive ?? true,
    });
    const saved = await this.repo.save(coupon);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateCouponDto): Promise<CouponResponseDto> {
    const coupon = await this.repo.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon ${id} not found`);
    if (dto.code) dto.code = dto.code.toUpperCase();
    Object.assign(coupon, dto);
    await this.repo.save(coupon);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const coupon = await this.repo.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon ${id} not found`);
    await this.repo.softDelete(id);
  }

  async validate(dto: ValidateCouponDto): Promise<CouponValidationResponseDto> {
    const coupon = await this.repo.findOne({
      where: { code: dto.code.toUpperCase(), isActive: true },
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
      discount = +(dto.orderAmount * (+coupon.value / 100)).toFixed(2);
    } else {
      discount = Math.min(+coupon.value, dto.orderAmount);
    }

    return {
      valid: true,
      discount,
      finalAmount: +(dto.orderAmount - discount).toFixed(2),
    };
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
      createdAt: coupon.createdAt?.toISOString(),
    };
  }
}
