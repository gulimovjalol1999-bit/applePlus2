import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymeTransaction } from './entities/payme-transaction.entity';
import { Order } from '../orders/entities/order.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymeService } from './payme/payme.service';
import { PaymeController } from './payme/payme.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, PaymeTransaction, Order])],
  controllers: [PaymentsController, PaymeController],
  providers: [PaymentsService, PaymeService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
