import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductVariantsAndImages20260604000005 implements MigrationInterface {
  name = 'CreateProductVariantsAndImages20260604000005';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "product_variants" (
        "id"          UUID           NOT NULL DEFAULT gen_random_uuid(),
        "product_id"  UUID           NOT NULL,
        "sku"         VARCHAR(100)   NOT NULL,
        "name"        VARCHAR(200)   NOT NULL,
        "price"       DECIMAL(12,2)  NOT NULL,
        "sale_price"  DECIMAL(12,2),
        "attributes"  JSONB          NOT NULL DEFAULT '{}',
        "weight_kg"   DECIMAL(8,3),
        "is_default"  BOOLEAN        NOT NULL DEFAULT false,
        "is_active"   BOOLEAN        NOT NULL DEFAULT true,
        "created_at"  TIMESTAMPTZ    NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ    NOT NULL DEFAULT now(),
        "deleted_at"  TIMESTAMPTZ,
        CONSTRAINT "PK_product_variants"      PRIMARY KEY ("id"),
        CONSTRAINT "UQ_product_variants_sku"  UNIQUE ("sku"),
        CONSTRAINT "CHK_product_variants_price" CHECK ("price" > 0),
        CONSTRAINT "FK_product_variants_product"
          FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_product_variants_product_id"
        ON "product_variants" ("product_id")
        WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "product_images" (
        "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
        "product_id"  UUID         NOT NULL,
        "variant_id"  UUID,
        "url"         VARCHAR(500) NOT NULL,
        "alt_text"    VARCHAR(255),
        "sort_order"  INTEGER      NOT NULL DEFAULT 0,
        "is_primary"  BOOLEAN      NOT NULL DEFAULT false,
        "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "deleted_at"  TIMESTAMPTZ,
        CONSTRAINT "PK_product_images" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_images_product"
          FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_images_variant"
          FOREIGN KEY ("variant_id") REFERENCES "product_variants" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_product_images_product_id" ON "product_images" ("product_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_images"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_variants"`);
  }
}
