import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, TokenPairDto } from './dto/auth-response.dto';
import { sha256 } from '../../common/utils/hash.util';
import { User } from '../users/user.entity';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
    private readonly redis: RedisService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.users.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    // Fire-and-forget — registration should not fail because of email delivery
    void this.notifications.sendWelcomeEmail(user.email, user.firstName);

    return this.buildResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.buildResponse(user);
  }

  async refresh(userId: string): Promise<TokenPairDto> {
    const user = await this.users.findByIdOrThrow(userId);
    const tokens = await this.generateTokens(user);
    await this.users.setRefreshTokenHash(user.id, sha256(tokens.refreshToken));
    return tokens;
  }

  async logout(userId: string, accessJti: string, accessExp: number): Promise<void> {
    const remainingSeconds = accessExp - Math.floor(Date.now() / 1000);
    if (remainingSeconds > 0) {
      await this.redis.blacklistToken(accessJti, remainingSeconds);
    }
    await this.users.setRefreshTokenHash(userId, null);
  }

  private async buildResponse(user: User): Promise<AuthResponseDto> {
    const tokens = await this.generateTokens(user);
    await this.users.setRefreshTokenHash(user.id, sha256(tokens.refreshToken));
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens,
    };
  }

  private async generateTokens(user: User): Promise<TokenPairDto> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    // expiresIn is typed as StringValue in @nestjs/jwt v11; cast from config string is safe
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const asExpiry = (v: string | undefined): any => v;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: asExpiry(this.config.get<string>('jwt.accessExpiresIn')),
        jwtid: randomBytes(16).toString('hex'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: asExpiry(this.config.get<string>('jwt.refreshExpiresIn')),
        jwtid: randomBytes(16).toString('hex'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
