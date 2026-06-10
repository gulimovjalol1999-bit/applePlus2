import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandFilterDto } from './dto/brand-filter.dto';
import { BrandResponseDto } from './dto/brand-response.dto';
import { PaginatedMeta } from '../../common/dto/base-response.dto';
import { toSlug } from '../../common/utils/slug.util';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly repo: Repository<Brand>,
  ) {}

  async findAll(
    filter: BrandFilterDto,
  ): Promise<{ data: BrandResponseDto[]; meta: PaginatedMeta }> {
    const qb = this.repo
      .createQueryBuilder('b')
      .where('b.deletedAt IS NULL');

    if (filter.search) {
      qb.andWhere('b.name ILIKE :search', { search: `%${filter.search}%` });
    }
    if (filter.isActive !== undefined) {
      qb.andWhere('b.isActive = :isActive', { isActive: filter.isActive });
    }

    qb.orderBy('b.name', 'ASC');
    qb.skip((filter.page - 1) * filter.limit).take(filter.limit);

    const [brands, total] = await qb.getManyAndCount();
    return {
      data: brands.map((b) => this.toDto(b)),
      meta: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }

  async findOne(id: string): Promise<BrandResponseDto> {
    const brand = await this.repo.findOne({ where: { id } });
    if (!brand) throw new NotFoundException(`Brand ${id} not found`);
    return this.toDto(brand);
  }

  async create(dto: CreateBrandDto, createdById?: string): Promise<BrandResponseDto> {
    const existing = await this.repo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Brand name "${dto.name}" already exists`);
    const slug = await this.uniqueSlug(dto.name);

    const brand = this.repo.create({
      ...dto,
      slug,
      isActive: dto.isActive ?? true,
      createdById: createdById ?? null,
    });
    const saved = await this.repo.save(brand);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateBrandDto): Promise<BrandResponseDto> {
    const brand = await this.repo.findOne({ where: { id } });
    if (!brand) throw new NotFoundException(`Brand ${id} not found`);

    if (dto.name && dto.name !== brand.name) {
      brand.slug = await this.uniqueSlug(dto.name, id);
    }
    Object.assign(brand, dto);
    await this.repo.save(brand);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const brand = await this.repo.findOne({ where: { id } });
    if (!brand) throw new NotFoundException(`Brand ${id} not found`);
    await this.repo.softDelete(id);
  }

  private async uniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = toSlug(name);
    for (let i = 0; i < 100; i++) {
      const slug = i === 0 ? base : `${base}-${i}`;
      const qb = this.repo
        .createQueryBuilder('b')
        .where('b.slug = :slug', { slug })
        .withDeleted();
      if (excludeId) qb.andWhere('b.id != :excludeId', { excludeId });
      const exists = await qb.getExists();
      if (!exists) return slug;
    }
    return `${base}-${Date.now()}`;
  }

  private toDto(brand: Brand): BrandResponseDto {
    return {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logoUrl: brand.logoUrl,
      websiteUrl: brand.websiteUrl,
      isActive: brand.isActive,
      createdAt: brand.createdAt.toISOString(),
      updatedAt: brand.updatedAt.toISOString(),
    };
  }
}
