import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewFilterDto } from './dto/review-filter.dto';
import { PublicReviewResponseDto, ReviewResponseDto } from './dto/review-response.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Public: always returns approved reviews only; the isApproved filter from
  // ReviewFilterDto is intentionally ignored here to prevent leaking pending reviews.
  @Get()
  @ApiOperation({ summary: 'List approved reviews (public)' })
  @ApiOkResponse({ type: PublicReviewResponseDto, isArray: true })
  findAll(@Query() filter: ReviewFilterDto) {
    return this.reviewsService.findAll(filter);
  }

  // Admin: returns unapproved reviews awaiting moderation.
  @Get('pending')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'List unapproved reviews pending moderation (admin)' })
  @ApiOkResponse({ type: ReviewResponseDto, isArray: true })
  findPending(@Query() filter: ReviewFilterDto) {
    return this.reviewsService.findPending(filter);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit a review — requires a delivered order containing the product' })
  @ApiCreatedResponse({ type: ReviewResponseDto })
  create(
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.reviewsService.create(user.id, dto);
  }

  @Patch(':id/approve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Approve a review (admin)' })
  @ApiOkResponse({ type: ReviewResponseDto })
  approve(@Param('id', ParseUuidPipe) id: string) {
    return this.reviewsService.approve(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a review (admin)' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUuidPipe) id: string) {
    return this.reviewsService.remove(id);
  }
}
