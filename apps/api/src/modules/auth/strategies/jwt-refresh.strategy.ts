import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from './jwt.strategy';
import { sha256 } from '../../../common/utils/hash.util';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      secretOrKey: config.get<string>('jwt.refreshSecret')!,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken: string = req.body?.refreshToken;
    if (!refreshToken) throw new UnauthorizedException();

    const user = await this.users.findByIdWithRefreshToken(payload.sub);
    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new UnauthorizedException();
    }

    if (user.refreshTokenHash !== sha256(refreshToken)) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}
