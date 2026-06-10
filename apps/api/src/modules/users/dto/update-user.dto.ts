import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { UpdateProfileDto } from './update-profile.dto';

export class UpdateUserDto extends UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Enable or disable the account' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
