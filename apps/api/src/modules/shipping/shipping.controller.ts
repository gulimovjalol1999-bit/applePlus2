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
import { ShippingService } from './shipping.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { AddressResponseDto, ShipmentResponseDto } from './dto/shipping-response.dto';

@ApiTags('Shipping')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  // ----- Addresses (user-owned) -----

  @Get('addresses')
  @ApiOperation({ summary: 'List current user addresses' })
  @ApiOkResponse({ type: AddressResponseDto, isArray: true })
  findAddresses(@CurrentUser() user: { id: string }) {
    return this.shippingService.findAddresses(user.id);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Create address' })
  @ApiCreatedResponse({ type: AddressResponseDto })
  createAddress(
    @Body() dto: CreateAddressDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.shippingService.createAddress(user.id, dto);
  }

  @Patch('addresses/:id')
  @ApiOperation({ summary: 'Update address' })
  @ApiOkResponse({ type: AddressResponseDto })
  updateAddress(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: CreateAddressDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.shippingService.updateAddress(id, user.id, dto);
  }

  @Delete('addresses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete address' })
  @ApiNoContentResponse()
  deleteAddress(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.shippingService.deleteAddress(id, user.id);
  }

  // ----- Shipments (admin) -----

  @Post('shipments')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: 'Create shipment (admin)' })
  @ApiCreatedResponse({ type: ShipmentResponseDto })
  createShipment(@Body() dto: CreateShipmentDto) {
    return this.shippingService.createShipment(dto);
  }

  @Get('shipments/order/:orderId')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: 'Get shipments by order ID (admin)' })
  @ApiOkResponse({ type: ShipmentResponseDto, isArray: true })
  findByOrder(@Param('orderId', ParseUuidPipe) orderId: string) {
    return this.shippingService.findShipmentsByOrder(orderId);
  }

  @Get('shipments/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: 'Get shipment by ID (admin)' })
  @ApiOkResponse({ type: ShipmentResponseDto })
  findShipment(@Param('id', ParseUuidPipe) id: string) {
    return this.shippingService.findShipment(id);
  }

  @Patch('shipments/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: 'Update shipment tracking / status (admin)' })
  @ApiOkResponse({ type: ShipmentResponseDto })
  updateShipment(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateShipmentDto,
  ) {
    return this.shippingService.updateShipment(id, dto);
  }
}
