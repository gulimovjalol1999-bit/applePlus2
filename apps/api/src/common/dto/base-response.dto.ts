import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginatedMeta {
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() total: number;
  @ApiProperty() totalPages: number;
}

export class BaseResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  data: T;

  @ApiPropertyOptional({ type: () => PaginatedMeta })
  meta?: PaginatedMeta;
}
