import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdersTable20260604000006 implements MigrationInterface {
  name = 'CreateOrdersTable20260604000006';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "order_status_enum" AS ENUM (
        'new', 'confirmed', 'shipping', 'delivered', 'cancelled'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id"               UUID           NOT NULL DEFAULT gen_random_uuid(),
        "order_number"     VARCHAR(30)    NOT NULL,
        "user_id"          UUID,
        "status"           "order_status_enum" NOT NULL DEFAULT 'new',
        "total_amount"     DECIMAL(12,2)  NOT NULL DEFAULT 0,
        "discount_amount"  DECIMAL(12,2)  NOT NULL DEFAULT 0,
        "shipping_amount"  DECIMAL(12,2)  NOT NULL DEFAULT 0,
        "notes"            TEXT,
        "created_at"       TIMESTAMPTZ    NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMPTZ    NOT NULL DEFAULT now(),
        "deleted_at"       TIMESTAMPTZ,
        CONSTRAINT "PK_orders"              PRIMARY KEY ("id"),
        CONSTRAINT "UQ_orders_order_number" UNIQUE ("order_number"),
        CONSTRAINT "CHK_orders_total"    CHECK ("total_amount"    >= 0),
        CONSTRAINT "CHK_orders_discount" CHECK ("discount_amount" >= 0),
        CONSTRAINT "CHK_orders_shipping" CHECK ("shipping_amount" >= 0),
        CONSTRAINT "FK_orders_user"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_orders_user_id"   ON "orders" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_orders_status"    ON "orders" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_orders_created_at" ON "orders" ("created_at" DESC)
        WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id"            UUID           NOT NULL DEFAULT gen_random_uuid(),
        "order_id"      UUID           NOT NULL,
        "product_id"    UUID           NOT NULL,
        "variant_id"    UUID           NOT NULL,
        "product_name"  VARCHAR(300)   NOT NULL,
        "quantity"      INTEGER        NOT NULL,
        "unit_price"    DECIMAL(12,2)  NOT NULL,
        "total_price"   DECIMAL(12,2)  NOT NULL,
        "created_at"    TIMESTAMPTZ    NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMPTZ    NOT NULL DEFAULT now(),
        "deleted_at"    TIMESTAMPTZ,
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_order_items_qty"         CHECK ("quantity"    > 0),
        CONSTRAINT "CHK_order_items_unit_price"  CHECK ("unit_price"  > 0),
        CONSTRAINT "CHK_order_items_total_price" CHECK ("total_price" > 0),
        CONSTRAINT "FK_order_items_order"
          FOREIGN KEY ("order_id")   REFERENCES "orders"           ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_items_product"
          FOREIGN KEY ("product_id") REFERENCES "products"         ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_order_items_variant"
          FOREIGN KEY ("variant_id") REFERENCES "product_variants" ("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_items_order_id" ON "order_items" ("order_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "order_status_enum"`);
  }
}
