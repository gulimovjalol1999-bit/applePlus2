import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBrandsTable20260604000003 implements MigrationInterface {
  name = 'CreateBrandsTable20260604000003';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "brands" (
        "id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
        "name"           VARCHAR(150) NOT NULL,
        "slug"           VARCHAR(200) NOT NULL,
        "description"    TEXT,
        "logo_url"       VARCHAR(500),
        "website_url"    VARCHAR(500),
        "is_active"      BOOLEAN      NOT NULL DEFAULT true,
        "created_by_id"  UUID,
        "created_at"     TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at"     TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "deleted_at"     TIMESTAMPTZ,
        CONSTRAINT "PK_brands"      PRIMARY KEY ("id"),
        CONSTRAINT "UQ_brands_name" UNIQUE ("name"),
        CONSTRAINT "UQ_brands_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_brands_is_active" ON "brands" ("is_active")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "brands"`);
  }
}
