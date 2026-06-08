import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { WishlistService } from './wishlist.service';
import { WishlistItemResponseDto } from './dto/wishlist-response.dto';

@ApiTags('Wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user wishlist' })
  @ApiOkResponse({ type: WishlistItemResponseDto, isArray: true })
  findAll(
    @CurrentUser() user: { id: string },
    @Query() pagination: PaginationDto,
  ) {
    return this.wishlistService.findByUser(user.id, pagination);
  }

  @Get(':productId/check')
  @ApiOperation({ summary: 'Check if product is in wishlist' })
  check(
    @Param('productId', ParseUuidPipe) productId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.wishlistService.isInWishlist(user.id, productId);
  }

  @Post(':productId')
  @ApiOperation({ summary: 'Add product to wishlist' })
  @ApiCreatedResponse({ type: WishlistItemResponseDto })
  addItem(
    @Param('productId', ParseUuidPipe) productId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.wishlistService.addItem(user.id, productId);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove product from wishlist' })
  @ApiNoContentResponse()
  removeItem(
    @Param('productId', ParseUuidPipe) productId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.wishlistService.removeItem(user.id, productId);
  }
}
