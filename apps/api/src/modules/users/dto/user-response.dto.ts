import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiPropertyOptional({ nullable: true }) phone: string | null;
  @ApiProperty({ enum: Role }) role: Role;
  @ApiProperty() isActive: boolean;
  @ApiPropertyOptional({ nullable: true }) emailVerifiedAt: string | null;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
