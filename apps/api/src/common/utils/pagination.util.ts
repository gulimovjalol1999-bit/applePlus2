import { PaginationDto } from '../dto/pagination.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function paginate<T>(
  items: T[],
  total: number,
  dto: PaginationDto,
): PaginatedResult<T> {
  return {
    data: items,
    meta: {
      page: dto.page,
      limit: dto.limit,
      total,
      totalPages: Math.ceil(total / dto.limit),
    },
  };
}

export function paginationToSkipTake(dto: PaginationDto): {
  skip: number;
  take: number;
} {
  return {
    skip: (dto.page - 1) * dto.limit,
    take: dto.limit,
  };
}
