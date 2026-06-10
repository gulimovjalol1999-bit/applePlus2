import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { MergeCartDto } from './dto/merge-cart.dto';
import { CartResponseDto } from './dto/cart-response.dto';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // ─── Authenticated endpoints ───────────────────────────────────────────────

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user cart' })
  @ApiOkResponse({ type: CartResponseDto })
  getCart(@CurrentUser() user: { id: string }) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add item to cart (authenticated)' })
  @ApiOkResponse({ type: CartResponseDto })
  addItem(@Body() dto: AddToCartDto, @CurrentUser() user: { id: string }) {
    return this.cartService.addItem(dto, user.id);
  }

  @Patch('items/:variantId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update item quantity (authenticated)' })
  @ApiOkResponse({ type: CartResponseDto })
  updateItem(
    @Param('variantId', ParseUuidPipe) variantId: string,
    @Body() dto: UpdateCartItemDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.cartService.updateItem(variantId, dto, user.id);
  }

  @Delete('items/:variantId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove item from cart (authenticated)' })
  @ApiOkResponse({ type: CartResponseDto })
  removeItem(
    @Param('variantId', ParseUuidPipe) variantId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.cartService.removeItem(variantId, user.id);
  }

  @Delete()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear entire cart (authenticated)' })
  clearCart(@CurrentUser() user: { id: string }) {
    return this.cartService.clearCart(user.id);
  }

  @Post('merge')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Merge guest cart into user cart after login' })
  @ApiOkResponse({ type: CartResponseDto })
  mergeCart(@Body() dto: MergeCartDto, @CurrentUser() user: { id: string }) {
    return this.cartService.mergeSessionCart(user.id, dto.sessionId);
  }

  // ─── Guest endpoints (X-Session-Id header required) ───────────────────────

  @Get('guest')
  @ApiHeader({ name: 'X-Session-Id', description: 'Guest session ID', required: true })
  @ApiOperation({ summary: 'Get guest cart' })
  @ApiOkResponse({ type: CartResponseDto })
  getGuestCart(@Req() req: Request) {
    return this.cartService.getCart(undefined, this.requireSessionId(req));
  }

  @Post('guest/items')
  @ApiHeader({ name: 'X-Session-Id', description: 'Guest session ID', required: true })
  @ApiOperation({ summary: 'Add item to guest cart' })
  @ApiOkResponse({ type: CartResponseDto })
  addGuestItem(@Body() dto: AddToCartDto, @Req() req: Request) {
    return this.cartService.addItem(dto, undefined, this.requireSessionId(req));
  }

  @Patch('guest/items/:variantId')
  @ApiHeader({ name: 'X-Session-Id', description: 'Guest session ID', required: true })
  @ApiOperation({ summary: 'Update guest cart item quantity' })
  @ApiOkResponse({ type: CartResponseDto })
  updateGuestItem(
    @Param('variantId', ParseUuidPipe) variantId: string,
    @Body() dto: UpdateCartItemDto,
    @Req() req: Request,
  ) {
    return this.cartService.updateItem(variantId, dto, undefined, this.requireSessionId(req));
  }

  @Delete('guest/items/:variantId')
  @ApiHeader({ name: 'X-Session-Id', description: 'Guest session ID', required: true })
  @ApiOperation({ summary: 'Remove item from guest cart' })
  @ApiOkResponse({ type: CartResponseDto })
  removeGuestItem(
    @Param('variantId', ParseUuidPipe) variantId: string,
    @Req() req: Request,
  ) {
    return this.cartService.removeItem(variantId, undefined, this.requireSessionId(req));
  }

  @Delete('guest')
  @ApiHeader({ name: 'X-Session-Id', description: 'Guest session ID', required: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear guest cart' })
  clearGuestCart(@Req() req: Request) {
    return this.cartService.clearCart(undefined, this.requireSessionId(req));
  }

  // ─── helper ───────────────────────────────────────────────────────────────

  private requireSessionId(req: Request): string {
    const sessionId = req.headers['x-session-id'] as string | undefined;
    if (!sessionId?.trim()) {
      throw new BadRequestException('X-Session-Id header is required');
    }
    return sessionId;
  }
}
