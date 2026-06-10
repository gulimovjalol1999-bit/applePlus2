import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Role } from '../../common/enums/role.enum';

@Entity('users')
export class User extends BaseEntity {
  @Index()
  @Column({ length: 254, unique: true })
  email: string;

  @Column({ length: 100, select: false })
  passwordHash: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Index({ unique: true, where: '"phone" IS NOT NULL' })
  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'enum', enum: Role, default: Role.CUSTOMER })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true, select: false })
  refreshTokenHash: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerifiedAt: Date | null;
}
