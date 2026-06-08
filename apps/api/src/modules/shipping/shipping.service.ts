import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { Shipment } from './entities/shipment.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { AddressResponseDto, ShipmentResponseDto } from './dto/shipping-response.dto';
import { ShipmentStatus } from '../../common/enums/shipment-status.enum';

@Injectable()
export class ShippingService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
  ) {}

  // ----- Addresses -----

  async findAddresses(userId: string): Promise<AddressResponseDto[]> {
    const addresses = await this.addressRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
    return addresses.map((a) => this.toAddressDto(a));
  }

  async createAddress(userId: string, dto: CreateAddressDto): Promise<AddressResponseDto> {
    if (dto.isDefault) {
      await this.addressRepo.update({ userId }, { isDefault: false });
    }
    const address = this.addressRepo.create({
      ...dto,
      userId,
      label: dto.label ?? 'Home',
      country: dto.country ?? 'UZ',
      isDefault: dto.isDefault ?? false,
    });
    const saved = await this.addressRepo.save(address);
    return this.toAddressDto(saved);
  }

  async updateAddress(
    id: string,
    userId: string,
    dto: Partial<CreateAddressDto>,
  ): Promise<AddressResponseDto> {
    const address = await this.addressRepo.findOne({ where: { id, userId } });
    if (!address) throw new NotFoundException(`Address ${id} not found`);
    if (dto.isDefault) {
      await this.addressRepo.update({ userId }, { isDefault: false });
    }
    Object.assign(address, dto);
    await this.addressRepo.save(address);
    return this.toAddressDto(address);
  }

  async deleteAddress(id: string, userId: string): Promise<void> {
    const address = await this.addressRepo.findOne({ where: { id, userId } });
    if (!address) throw new NotFoundException(`Address ${id} not found`);
    await this.addressRepo.remove(address);
  }

  // ----- Shipments -----

  async createShipment(dto: CreateShipmentDto): Promise<ShipmentResponseDto> {
    const shipment = this.shipmentRepo.create({
      orderId: dto.orderId,
      carrier: dto.carrier,
      trackingNumber: dto.trackingNumber ?? null,
      estimatedAt: dto.estimatedAt ?? null,
      shippingAddress: dto.shippingAddress ?? {},
      status: ShipmentStatus.PENDING,
    });
    const saved = await this.shipmentRepo.save(shipment);
    return this.toShipmentDto(saved);
  }

  async findShipmentsByOrder(orderId: string): Promise<ShipmentResponseDto[]> {
    const shipments = await this.shipmentRepo.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
    return shipments.map((s) => this.toShipmentDto(s));
  }

  async findShipment(id: string): Promise<ShipmentResponseDto> {
    const shipment = await this.shipmentRepo.findOne({ where: { id } });
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);
    return this.toShipmentDto(shipment);
  }

  async updateShipment(id: string, dto: UpdateShipmentDto): Promise<ShipmentResponseDto> {
    const shipment = await this.shipmentRepo.findOne({ where: { id } });
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);

    if (dto.status) shipment.status = dto.status;
    if (dto.trackingNumber !== undefined) shipment.trackingNumber = dto.trackingNumber;
    if (dto.estimatedAt !== undefined) shipment.estimatedAt = dto.estimatedAt;
    if (dto.deliveredAt !== undefined) shipment.deliveredAt = dto.deliveredAt;
    if (dto.status === ShipmentStatus.DELIVERED && !shipment.deliveredAt) {
      shipment.deliveredAt = new Date();
    }

    await this.shipmentRepo.save(shipment);
    return this.toShipmentDto(shipment);
  }

  private toAddressDto(a: Address): AddressResponseDto {
    return {
      id: a.id,
      userId: a.userId,
      label: a.label,
      fullName: a.fullName,
      phone: a.phone,
      addressLine: a.addressLine,
      city: a.city,
      region: a.region,
      postalCode: a.postalCode,
      country: a.country,
      isDefault: a.isDefault,
      createdAt: a.createdAt?.toISOString(),
    };
  }

  private toShipmentDto(s: Shipment): ShipmentResponseDto {
    return {
      id: s.id,
      orderId: s.orderId,
      carrier: s.carrier,
      trackingNumber: s.trackingNumber,
      status: s.status,
      estimatedAt: s.estimatedAt?.toISOString() ?? null,
      deliveredAt: s.deliveredAt?.toISOString() ?? null,
      shippingAddress: s.shippingAddress,
      createdAt: s.createdAt?.toISOString(),
      updatedAt: s.updatedAt?.toISOString(),
    };
  }
}
