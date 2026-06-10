import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { StorageObjectStatus } from '../../../common/enums/storage-object-status.enum';

/**
 * Tracks every object written to (or reserved in) the storage bucket so
 * that orphaned files and dangling DB references can be detected.
 */
@Entity('storage_objects')
@Index('idx_storage_objects_status', ['status'])
@Index('idx_storage_objects_created_by', ['createdBy'])
export class StorageObject extends BaseEntity {
  @Column({ type: 'varchar', length: 512, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 1024 })
  url: string;

  @Column({ type: 'varchar', length: 50 })
  folder: string;

  @Column({ type: 'varchar', length: 100 })
  mimetype: string;

  @Column({ type: 'int', nullable: true })
  size: number | null;

  @Column({ type: 'varchar', length: 20, default: StorageObjectStatus.CONFIRMED })
  status: StorageObjectStatus;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;
}
