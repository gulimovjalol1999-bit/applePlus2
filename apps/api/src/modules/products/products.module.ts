import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { UsedPhoneDetails } from '../inventory/entities/used-phone-details.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductVariant, ProductImage, InventoryItem, UsedPhoneDetails]),
    InventoryModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
