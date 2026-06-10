import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: '+998901234567', nullable: true })
  @IsOptional()
  @Matches(/^\+?[0-9][0-9\s-]{4,28}[0-9]$/, {
    message: 'phone must be a valid phone number',
  })
  phone?: string | null;
}
