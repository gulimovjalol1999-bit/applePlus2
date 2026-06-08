import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoriesTable20260604000002 implements MigrationInterface {
  name = 'CreateCategoriesTable20260604000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id"               UUID          NOT NULL DEFAULT gen_random_uuid(),
        "parent_id"        UUID,
        "name"             VARCHAR(150)  NOT NULL,
        "slug"             VARCHAR(200)  NOT NULL,
        "description"      TEXT,
        "image_url"        VARCHAR(500),
        "meta_title"       VARCHAR(160),
        "meta_description" VARCHAR(320),
        "sort_order"       INTEGER       NOT NULL DEFAULT 0,
        "is_active"        BOOLEAN       NOT NULL DEFAULT true,
        "created_by_id"    UUID,
        "created_at"       TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "deleted_at"       TIMESTAMPTZ,
        CONSTRAINT "PK_categories"      PRIMARY KEY ("id"),
        CONSTRAINT "UQ_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_categories_parent"
          FOREIGN KEY ("parent_id") REFERENCES "categories" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_categories_parent_id" ON "categories" ("parent_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_categories_is_active" ON "categories" ("is_active")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
