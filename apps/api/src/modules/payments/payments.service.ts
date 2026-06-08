import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
  ) {}

  async create(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    const payment = this.repo.create({
      orderId: dto.orderId,
      provider: dto.provider,
      amount: dto.amount,
      currency: dto.currency ?? 'USD',
      status: PaymentStatus.PENDING,
      metadata: {},
    });
    const saved = await this.repo.save(payment);
    return this.findOne(saved.id);
  }

  async findByOrder(orderId: string): Promise<PaymentResponseDto[]> {
    const payments = await this.repo.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
    return payments.map((p) => this.toDto(p));
  }

  async findOne(id: string): Promise<PaymentResponseDto> {
    const payment = await this.repo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    return this.toDto(payment);
  }

  async updateStatus(id: string, dto: UpdatePaymentDto): Promise<PaymentResponseDto> {
    const payment = await this.repo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);

    payment.status = dto.status;
    if (dto.providerPaymentId !== undefined) payment.providerPaymentId = dto.providerPaymentId;
    if (dto.metadata !== undefined) payment.metadata = dto.metadata;
    if (dto.paidAt !== undefined) payment.paidAt = dto.paidAt;
    if (dto.status === PaymentStatus.PAID && !payment.paidAt) {
      payment.paidAt = new Date();
    }

    await this.repo.save(payment);
    return this.toDto(payment);
  }

  private toDto(payment: Payment): PaymentResponseDto {
    return {
      id: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
      amount: +payment.amount,
      currency: payment.currency,
      metadata: payment.metadata,
      paidAt: payment.paidAt?.toISOString() ?? null,
      createdAt: payment.createdAt?.toISOString(),
      updatedAt: payment.updatedAt?.toISOString(),
    };
  }
}
