import {
  Column,
  Entity,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CartItem } from './cart-item.entity';

@Entity('carts')
export class Cart extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, unique: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  sessionId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  items: CartItem[];
}
