import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { WebhookPaymentDto } from './dto/webhook-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Create payment record for an order' })
  @ApiCreatedResponse({ type: PaymentResponseDto })
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  /**
   * Called by the payment provider (Stripe, Payme, Click, etc.).
   * No JWT — authenticated via HMAC signature in x-payment-signature header.
   * Requires PAYMENT_WEBHOOK_SECRET env var; skips signature check in development when unset.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment provider webhook callback (HMAC-verified)' })
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-payment-signature') signature: string,
    @Body() dto: WebhookPaymentDto,
  ) {
    this.verifySignature(req.rawBody, signature);
    await this.paymentsService.processWebhook(dto);
    return { received: true };
  }

  @Get('order/:orderId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Get payments by order ID' })
  @ApiOkResponse({ type: PaymentResponseDto, isArray: true })
  findByOrder(@Param('orderId', ParseUuidPipe) orderId: string) {
    return this.paymentsService.findByOrder(orderId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiOkResponse({ type: PaymentResponseDto })
  findOne(@Param('id', ParseUuidPipe) id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Manually update payment status (admin override)' })
  @ApiOkResponse({ type: PaymentResponseDto })
  updateStatus(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.paymentsService.updateStatus(id, dto);
  }

  private verifySignature(rawBody: Buffer | undefined, signature: string): void {
    const secret = this.config.get<string>('app.paymentWebhookSecret');
    if (!secret) return; // Dev convenience: skip when PAYMENT_WEBHOOK_SECRET is not set

    if (!signature || !rawBody) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const actual = signature.replace(/^sha256=/, '');

    let match = false;
    try {
      match = timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual, 'hex'));
    } catch {
      // Buffer length mismatch means invalid signature
    }

    if (!match) throw new UnauthorizedException('Invalid webhook signature');
  }
}
