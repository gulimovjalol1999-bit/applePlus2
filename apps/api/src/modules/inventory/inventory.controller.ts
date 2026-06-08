import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { InventoryFilterDto } from './dto/inventory-filter.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { InventoryItemDto } from './dto/inventory-item.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER, Role.MANAGER, Role.WAREHOUSE)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List all inventory items' })
  @ApiOkResponse({ type: InventoryItemDto, isArray: true })
  findAll(@Query() filter: InventoryFilterDto) {
    return this.inventoryService.findAll(filter);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Items at or below reorder level' })
  @ApiOkResponse({ type: InventoryItemDto, isArray: true })
  findLowStock(@Query() filter: InventoryFilterDto) {
    return this.inventoryService.findLowStock(filter);
  }

  @Get('out-of-stock')
  @ApiOperation({ summary: 'Items with zero available quantity' })
  @ApiOkResponse({ type: InventoryItemDto, isArray: true })
  findOutOfStock(@Query() filter: InventoryFilterDto) {
    return this.inventoryService.findOutOfStock(filter);
  }

  @Get(':variantId')
  @ApiOperation({ summary: 'Get inventory for a variant' })
  @ApiOkResponse({ type: InventoryItemDto })
  findOne(@Param('variantId', ParseUuidPipe) variantId: string) {
    return this.inventoryService.findByVariant(variantId);
  }

  @Post(':variantId/adjust')
  @ApiOperation({ summary: 'Adjust stock quantity (transactional, locked)' })
  @ApiOkResponse({ type: InventoryItemDto })
  adjustStock(
    @Param('variantId', ParseUuidPipe) variantId: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.inventoryService.adjustStock(variantId, dto, user?.id);
  }

  @Patch(':variantId')
  @ApiOperation({ summary: 'Update warehouse settings for a variant' })
  @ApiOkResponse({ type: InventoryItemDto })
  update(
    @Param('variantId', ParseUuidPipe) variantId: string,
    @Body() dto: UpdateInventoryDto,
  ) {
    return this.inventoryService.update(variantId, dto);
  }
}
