import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { Shipment } from './entities/shipment.entity';
import { Order } from '../orders/entities/order.entity';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Address, Shipment, Order])],
  controllers: [ShippingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
