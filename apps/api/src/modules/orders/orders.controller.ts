import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
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
import { PaginationDto } from '../../common/dto/pagination.dto';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(Role.OWNER, Role.MANAGER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Place a new order (prices fetched server-side)' })
  @ApiCreatedResponse({ type: OrderResponseDto })
  create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.ordersService.create(dto, user);
  }

  @Get()
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'List all orders (paginated) — admin only' })
  @ApiOkResponse({ type: OrderResponseDto, isArray: true })
  findAll(@Query() pagination: PaginationDto) {
    return this.ordersService.findAll(pagination);
  }

  @Get('my')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: "List the requesting customer's own orders" })
  @ApiOkResponse({ type: OrderResponseDto, isArray: true })
  findMine(
    @Query() pagination: PaginationDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.ordersService.findByUser(user.id, pagination);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.MANAGER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get a single order (customers only see their own)' })
  @ApiOkResponse({ type: OrderResponseDto })
  findOne(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.ordersService.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Update order status (admin only) — validates allowed transitions' })
  @ApiOkResponse({ type: OrderResponseDto })
  updateStatus(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
