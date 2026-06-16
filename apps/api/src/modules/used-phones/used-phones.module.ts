import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { UsedPhoneDetails } from '../inventory/entities/used-phone-details.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { UsedPhonesService } from './used-phones.service';
import { UsedPhonesController } from './used-phones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, UsedPhoneDetails]), InventoryModule],
  controllers: [UsedPhonesController],
  providers: [UsedPhonesService],
  exports: [UsedPhonesService],
})
export class UsedPhonesModule {}
