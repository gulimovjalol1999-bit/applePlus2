import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ProductStatus } from '../../common/enums/product-status.enum';
import { UsedPhoneDetails } from '../inventory/entities/used-phone-details.entity';
import { InventoryService } from '../inventory/inventory.service';
import { Product } from '../products/entities/product.entity';
import { UsedPhonesService } from './used-phones.service';

describe('UsedPhonesService.markSold', () => {
  let service: UsedPhonesService;
  let managerMock: {
    createQueryBuilder: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };

  const buildUpd = (overrides: Partial<UsedPhoneDetails> = {}) =>
    ({
      id: 'upd-1',
      soldAt: null,
      inventoryItem: {
        id: 'inv-1',
        quantity: 1,
        reservedQuantity: 0,
        soldCount: 0,
        variant: {
          product: {
            id: 'product-1',
            status: ProductStatus.ACTIVE,
          },
        },
      },
      ...overrides,
    }) as unknown as UsedPhoneDetails;

  const mockQueryBuilder = (result: UsedPhoneDetails | null) => ({
    setLock: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
  });

  beforeEach(async () => {
    managerMock = {
      createQueryBuilder: jest.fn(),
      save: jest.fn().mockImplementation((_entity, value) => Promise.resolve(value)),
      create: jest.fn().mockImplementation((_entity, value) => value),
    };

    const dataSourceMock = {
      transaction: jest.fn().mockImplementation((cb) => cb(managerMock)),
    };

    const module = await Test.createTestingModule({
      providers: [
        UsedPhonesService,
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: getRepositoryToken(UsedPhoneDetails), useValue: {} },
        { provide: InventoryService, useValue: {} },
        { provide: DataSource, useValue: dataSourceMock },
      ],
    }).compile();

    service = module.get(UsedPhonesService);
  });

  it('marks an available phone as sold', async () => {
    const upd = buildUpd();
    managerMock.createQueryBuilder.mockReturnValue(mockQueryBuilder(upd));

    const result = await service.markSold('product-1');

    expect(result).toEqual({
      productId: 'product-1',
      inventoryId: 'inv-1',
      sold: true,
      soldAt: expect.any(String),
    });
    expect(upd.inventoryItem.quantity).toBe(0);
    expect(upd.inventoryItem.soldCount).toBe(1);
    expect(upd.soldAt).toBeInstanceOf(Date);
    expect(upd.inventoryItem.variant.product.status).toBe(ProductStatus.ARCHIVED);
  });

  it('throws NotFoundException when the used phone does not exist', async () => {
    managerMock.createQueryBuilder.mockReturnValue(mockQueryBuilder(null));

    await expect(service.markSold('missing')).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when the phone is already marked as sold', async () => {
    const upd = buildUpd({ soldAt: new Date() });
    managerMock.createQueryBuilder.mockReturnValue(mockQueryBuilder(upd));

    await expect(service.markSold('product-1')).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when the phone has an active reservation', async () => {
    const upd = buildUpd();
    upd.inventoryItem.reservedQuantity = 1;
    managerMock.createQueryBuilder.mockReturnValue(mockQueryBuilder(upd));

    await expect(service.markSold('product-1')).rejects.toThrow(ConflictException);
  });
});
