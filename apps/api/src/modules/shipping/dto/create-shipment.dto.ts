import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShipmentDto {
  @ApiProperty()
  @IsUUID()
  orderId: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  carrier: string;

  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  trackingNumber?: string;

  @ApiPropertyOptional({ nullable: true })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  estimatedAt?: Date;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  shippingAddress?: Record<string, unknown>;
}
