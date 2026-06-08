import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponType } from '../entities/coupon.entity';

export class CouponResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() code: string;
  @ApiProperty({ enum: CouponType }) type: CouponType;
  @ApiProperty() value: number;
  @ApiPropertyOptional({ nullable: true }) minOrderAmount: number | null;
  @ApiPropertyOptional({ nullable: true }) maxUses: number | null;
  @ApiProperty() usedCount: number;
  @ApiProperty() isActive: boolean;
  @ApiPropertyOptional({ nullable: true }) startsAt: string | null;
  @ApiPropertyOptional({ nullable: true }) expiresAt: string | null;
  @ApiProperty() createdAt: string;
}

export class CouponValidationResponseDto {
  @ApiProperty() valid: boolean;
  @ApiProperty() discount: number;
  @ApiProperty() finalAmount: number;
}
