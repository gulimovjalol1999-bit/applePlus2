import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { User } from './user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { Role } from '../../common/enums/role.enum';
import { PaginatedMeta } from '../../common/dto/base-response.dto';

const POSTGRES_UNIQUE_VIOLATION = '23505';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async findByIdWithRefreshToken(id: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findAll(filter: UserFilterDto): Promise<{ data: User[]; meta: PaginatedMeta }> {
    const qb = this.repo.createQueryBuilder('user');

    if (filter.search) {
      qb.andWhere(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }
    if (filter.role) {
      qb.andWhere('user.role = :role', { role: filter.role });
    }

    qb.orderBy('user.createdAt', 'DESC');
    qb.skip((filter.page - 1) * filter.limit).take(filter.limit);

    const [users, total] = await qb.getManyAndCount();

    return {
      data: users,
      meta: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }

  async create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already registered');

    const user = this.repo.create({
      ...data,
      email: data.email.toLowerCase(),
    });

    try {
      return await this.repo.save(user);
    } catch (err) {
      throw this.toUniqueViolationError(err, 'Email already registered');
    }
  }

  async setRefreshTokenHash(userId: string, hash: string | null): Promise<void> {
    await this.repo.update({ id: userId, deletedAt: IsNull() }, { refreshTokenHash: hash });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findByIdOrThrow(userId);
    Object.assign(user, dto);
    try {
      return await this.repo.save(user);
    } catch (err) {
      throw this.toUniqueViolationError(err, 'Phone number already registered');
    }
  }

  async updateByAdmin(userId: string, dto: UpdateUserDto, actingUserRole: Role): Promise<User> {
    const user = await this.findByIdOrThrow(userId);
    if (user.role === Role.OWNER && actingUserRole !== Role.OWNER) {
      throw new ForbiddenException('Cannot modify an owner account');
    }
    Object.assign(user, dto);
    try {
      return await this.repo.save(user);
    } catch (err) {
      throw this.toUniqueViolationError(err, 'Phone number already registered');
    }
  }

  async updateRole(userId: string, role: Role): Promise<User> {
    const user = await this.findByIdOrThrow(userId);
    user.role = role;
    return this.repo.save(user);
  }

  async softDelete(userId: string): Promise<void> {
    await this.findByIdOrThrow(userId);
    await this.setRefreshTokenHash(userId, null);
    await this.repo.softDelete(userId);
  }

  toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private toUniqueViolationError(err: unknown, defaultMessage: string): unknown {
    const driverError = (err as { driverError?: { code?: string; constraint?: string } }).driverError;
    if (err instanceof QueryFailedError && driverError?.code === POSTGRES_UNIQUE_VIOLATION) {
      if (driverError.constraint === 'UQ_users_phone') {
        return new ConflictException('Phone number already registered');
      }
      return new ConflictException(defaultMessage);
    }
    return err;
  }
}
