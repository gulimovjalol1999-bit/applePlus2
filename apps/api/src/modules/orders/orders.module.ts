import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { User } from '../users/user.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersGateway } from './orders.gateway';
@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, ProductVariant, InventoryItem, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersGateway],
  exports: [OrdersService],
})
export class OrdersModule {}
