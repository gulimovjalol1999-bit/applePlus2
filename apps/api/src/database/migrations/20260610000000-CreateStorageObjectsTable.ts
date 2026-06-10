import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStorageObjectsTable20260610000000 implements MigrationInterface {
  name = 'CreateStorageObjectsTable20260610000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "storage_object_status_enum" AS ENUM ('pending', 'confirmed')
    `);

    await queryRunner.query(`
      CREATE TABLE "storage_objects" (
        "id"          UUID                          NOT NULL DEFAULT gen_random_uuid(),
        "key"         VARCHAR(512)                  NOT NULL,
        "url"         VARCHAR(1024)                 NOT NULL,
        "folder"      VARCHAR(50)                   NOT NULL,
        "mimetype"    VARCHAR(100)                  NOT NULL,
        "size"        INT,
        "status"      "storage_object_status_enum"  NOT NULL DEFAULT 'confirmed',
        "created_by"  UUID,
        "created_at"  TIMESTAMPTZ                   NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ                   NOT NULL DEFAULT now(),
        "deleted_at"  TIMESTAMPTZ,
        CONSTRAINT "PK_storage_objects" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_storage_objects_key" UNIQUE ("key")
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_storage_objects_status"     ON "storage_objects" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_storage_objects_created_by" ON "storage_objects" ("created_by")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "storage_objects"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "storage_object_status_enum"`);
  }
}
