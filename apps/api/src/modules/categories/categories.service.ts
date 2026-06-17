import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryFilterDto } from './dto/category-filter.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { PaginatedMeta } from '../../common/dto/base-response.dto';
import { toSlug } from '../../common/utils/slug.util';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  async findAll(
    filter: CategoryFilterDto,
  ): Promise<{ data: CategoryResponseDto[]; meta: PaginatedMeta }> {
    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.children', 'children');

    if (filter.search) {
      qb.andWhere('c.name ILIKE :search', { search: `%${filter.search}%` });
    }
    if (filter.parentId !== undefined) {
      qb.andWhere('c.parentId = :parentId', { parentId: filter.parentId });
    }
    if (filter.isActive !== undefined) {
      qb.andWhere('c.isActive = :isActive', { isActive: filter.isActive });
    }

    qb.orderBy('c.sortOrder', 'ASC').addOrderBy('c.name', 'ASC');
    qb.skip((filter.page - 1) * filter.limit).take(filter.limit);

    const [cats, total] = await qb.getManyAndCount();
    return {
      data: cats.map((c) => this.toDto(c)),
      meta: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }

  async findTree(): Promise<CategoryResponseDto[]> {
    const roots = await this.repo.find({
      where: { parentId: IsNull() },
      relations: ['children', 'children.children'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return roots.map((c) => this.toDto(c, true));
  }

  async findOne(id: string): Promise<CategoryResponseDto> {
    const cat = await this.repo.findOne({
      where: { id },
      relations: ['children', 'parent'],
    });
    if (!cat) throw new NotFoundException(`Category ${id} not found`);
    return this.toDto(cat, true);
  }

  async create(dto: CreateCategoryDto, createdById?: string): Promise<CategoryResponseDto> {
    const slug = await this.uniqueSlug(dto.name);
    const cat = this.repo.create({
      ...dto,
      slug,
      parentId: dto.parentId ?? null,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      createdById: createdById ?? null,
    });
    const saved = await this.repo.save(cat);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException(`Category ${id} not found`);

    // Slug is frozen after creation: renaming must NOT change the slug so existing
    // links and search-engine indexes stay valid (no 404 / redirect needed).
    Object.assign(cat, dto);
    await this.repo.save(cat);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException(`Category ${id} not found`);
    await this.repo.softDelete(id);
  }

  private async uniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = toSlug(name);
    for (let i = 0; i < 100; i++) {
      const slug = i === 0 ? base : `${base}-${i}`;
      const qb = this.repo
        .createQueryBuilder('c')
        .where('c.slug = :slug', { slug })
        .withDeleted();
      if (excludeId) qb.andWhere('c.id != :excludeId', { excludeId });
      const exists = await qb.getExists();
      if (!exists) return slug;
    }
    return `${base}-${Date.now()}`;
  }

  private toDto(cat: Category, withChildren = false): CategoryResponseDto {
    const dto: CategoryResponseDto = {
      id: cat.id,
      parentId: cat.parentId,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.imageUrl,
      metaTitle: cat.metaTitle,
      metaDescription: cat.metaDescription,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
      createdAt: cat.createdAt?.toISOString(),
      updatedAt: cat.updatedAt?.toISOString(),
    };
    if (withChildren && cat.children?.length) {
      dto.children = cat.children.map((ch) => this.toDto(ch, true));
    }
    return dto;
  }
}
