import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';

export class TokenPairDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}

export class AuthUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ enum: Role })
  role: Role;
}

export class AuthResponseDto {
  @ApiProperty({ type: () => AuthUserDto })
  user: AuthUserDto;

  @ApiProperty({ type: () => TokenPairDto })
  tokens: TokenPairDto;
}
