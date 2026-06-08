import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { AnalyticsService } from './analytics.service';
import {
  DailySalesQueryDto,
  MonthlyRevenueQueryDto,
  TopListQueryDto,
} from './dto/analytics-query.dto';
import {
  DailySalesRowDto,
  MonthlyRevenueRowDto,
  TopCategoryRowDto,
  TopProductRowDto,
} from './dto/analytics-response.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER, Role.MANAGER)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('daily-sales')
  @ApiOperation({
    summary: 'Daily order count and revenue',
    description: 'Defaults to all-time if no date range is provided.',
  })
  @ApiOkResponse({ type: DailySalesRowDto, isArray: true })
  dailySales(@Query() query: DailySalesQueryDto) {
    return this.analytics.dailySales(query);
  }

  @Get('monthly-revenue')
  @ApiOperation({
    summary: 'Monthly revenue breakdown for a given year',
    description: 'Defaults to the current year.',
  })
  @ApiOkResponse({ type: MonthlyRevenueRowDto, isArray: true })
  monthlyRevenue(@Query() query: MonthlyRevenueQueryDto) {
    return this.analytics.monthlyRevenue(query);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Top products by revenue' })
  @ApiOkResponse({ type: TopProductRowDto, isArray: true })
  topProducts(@Query() query: TopListQueryDto) {
    return this.analytics.topProducts(query);
  }

  @Get('top-categories')
  @ApiOperation({ summary: 'Top categories by revenue' })
  @ApiOkResponse({ type: TopCategoryRowDto, isArray: true })
  topCategories(@Query() query: TopListQueryDto) {
    return this.analytics.topCategories(query);
  }
}
