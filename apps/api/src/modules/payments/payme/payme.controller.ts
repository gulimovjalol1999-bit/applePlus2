import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums/role.enum';
import { PaymeService } from './payme.service';
import { PaymeError } from './payme-error';
import { PaymeRpcRequest } from './payme.types';
import {
  CreatePaymeCheckoutDto,
  PaymeCheckoutResponseDto,
} from './dto/payme-checkout.dto';

@ApiTags('Payme')
@Controller('payments/payme')
export class PaymeController {
  constructor(
    private readonly paymeService: PaymeService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Merchant API endpoint. Payme calls this with JSON-RPC requests.
   * Authenticated via HTTP Basic auth: login "Paycom", password = cashbox key.
   * The raw JSON-RPC body is returned verbatim — the global response-transform
   * interceptor skips this exact path so Payme receives the shape it expects.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async merchant(
    @Body() body: PaymeRpcRequest,
    @Headers('authorization') authHeader: string,
  ): Promise<Record<string, unknown>> {
    const id = body?.id ?? null;
    try {
      this.verifyAuth(authHeader);
      const result = await this.dispatch(body);
      return { jsonrpc: '2.0', id, result };
    } catch (err) {
      const e =
        err instanceof PaymeError ? err : PaymeError.cannotPerform();
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: e.code,
          message: e.localizedMessage,
          data: e.data,
        },
      };
    }
  }

  /**
   * Customer-facing: returns the Payme hosted-checkout URL for an order.
   * The customer is redirected there to enter their card.
   */
  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER, Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Create a Payme hosted-checkout redirect URL for an order' })
  @ApiOkResponse({ type: PaymeCheckoutResponseDto })
  async checkout(
    @Body() dto: CreatePaymeCheckoutDto,
    @CurrentUser() user: { id: string },
  ): Promise<PaymeCheckoutResponseDto> {
    const url = await this.paymeService.buildCheckoutUrl(dto.orderId, user.id);
    return { url };
  }

  private dispatch(body: PaymeRpcRequest): Promise<unknown> {
    const { method, params } = body;
    switch (method) {
      case 'CheckPerformTransaction':
        return this.paymeService.checkPerformTransaction(params);
      case 'CreateTransaction':
        return this.paymeService.createTransaction(params);
      case 'PerformTransaction':
        return this.paymeService.performTransaction(params);
      case 'CancelTransaction':
        return this.paymeService.cancelTransaction(params);
      case 'CheckTransaction':
        return this.paymeService.checkTransaction(params);
      case 'GetStatement':
        return this.paymeService.getStatement(params);
      default:
        throw PaymeError.methodNotFound(method);
    }
  }

  /** Verify HTTP Basic auth: "Paycom:<cashbox-key>". */
  private verifyAuth(authHeader: string | undefined): void {
    const key = this.config.get<string>('payme.key');
    // Dev convenience: skip when no key configured (sandbox not yet wired).
    if (!key) return;
    if (!authHeader?.startsWith('Basic ')) throw PaymeError.unauthorized();

    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
    const sep = decoded.indexOf(':');
    const password = sep === -1 ? '' : decoded.slice(sep + 1);

    const a = Buffer.from(password);
    const b = Buffer.from(key);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw PaymeError.unauthorized();
    }
  }
}
