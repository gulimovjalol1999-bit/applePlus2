import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsTable20260604000004 implements MigrationInterface {
  name = 'CreateProductsTable20260604000004';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "product_status_enum" AS ENUM ('draft', 'active', 'archived')
    `);

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id"                UUID            NOT NULL DEFAULT gen_random_uuid(),
        "category_id"       UUID            NOT NULL,
        "brand_id"          UUID            NOT NULL,
        "name"              VARCHAR(300)    NOT NULL,
        "slug"              VARCHAR(350)    NOT NULL,
        "description"       TEXT,
        "short_description" VARCHAR(500),
        "base_price"        DECIMAL(12,2)   NOT NULL,
        "sale_price"        DECIMAL(12,2),
        "status"            "product_status_enum" NOT NULL DEFAULT 'draft',
        "tags"              TEXT[]          NOT NULL DEFAULT '{}',
        "meta_title"        VARCHAR(160),
        "meta_description"  VARCHAR(320),
        "average_rating"    DECIMAL(3,2)    NOT NULL DEFAULT 0,
        "review_count"      INTEGER         NOT NULL DEFAULT 0,
        "created_by_id"     UUID,
        "updated_by_id"     UUID,
        "created_at"        TIMESTAMPTZ     NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMPTZ     NOT NULL DEFAULT now(),
        "deleted_at"        TIMESTAMPTZ,
        CONSTRAINT "PK_products"      PRIMARY KEY ("id"),
        CONSTRAINT "UQ_products_slug" UNIQUE ("slug"),
        CONSTRAINT "CHK_products_base_price"     CHECK ("base_price" > 0),
        CONSTRAINT "CHK_products_sale_price"     CHECK ("sale_price" IS NULL OR "sale_price" > 0),
        CONSTRAINT "CHK_products_average_rating" CHECK ("average_rating" BETWEEN 0 AND 5),
        CONSTRAINT "CHK_products_review_count"   CHECK ("review_count" >= 0),
        CONSTRAINT "FK_products_category"
          FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_products_brand"
          FOREIGN KEY ("brand_id") REFERENCES "brands" ("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_products_category_status"
        ON "products" ("category_id", "status")
        WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_products_brand_status"
        ON "products" ("brand_id", "status")
        WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_products_status"
        ON "products" ("status")
        WHERE "deleted_at" IS NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "product_status_enum"`);
  }
}
