import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryTables20260604120000 implements MigrationInterface {
  name = 'CreateInventoryTables20260604120000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "inventory_items" (
        "id"                  UUID          NOT NULL DEFAULT gen_random_uuid(),
        "variant_id"          UUID          NOT NULL,
        "quantity"            INTEGER       NOT NULL DEFAULT 0,
        "reserved_quantity"   INTEGER       NOT NULL DEFAULT 0,
        "sold_count"          INTEGER       NOT NULL DEFAULT 0,
        "reorder_level"       INTEGER       NOT NULL DEFAULT 5,
        "warehouse_location"  VARCHAR(100),
        "updated_at"          TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inventory_items" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_inventory_items_variant_id" UNIQUE ("variant_id"),
        CONSTRAINT "CHK_inventory_items_quantity" CHECK ("quantity" >= 0),
        CONSTRAINT "CHK_inventory_items_reserved" CHECK ("reserved_quantity" >= 0),
        CONSTRAINT "CHK_inventory_items_reserved_lte_qty" CHECK ("reserved_quantity" <= "quantity"),
        CONSTRAINT "CHK_inventory_items_sold_count" CHECK ("sold_count" >= 0),
        CONSTRAINT "CHK_inventory_items_reorder_level" CHECK ("reorder_level" >= 0),
        CONSTRAINT "FK_inventory_items_variant_id"
          FOREIGN KEY ("variant_id")
          REFERENCES "product_variants" ("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_inventory_items_quantity" ON "inventory_items" ("quantity")
    `);

    await queryRunner.query(`
      CREATE TABLE "inventory_logs" (
        "id"                UUID        NOT NULL DEFAULT gen_random_uuid(),
        "inventory_item_id" UUID        NOT NULL,
        "adjustment"        INTEGER     NOT NULL,
        "quantity_before"   INTEGER     NOT NULL,
        "quantity_after"    INTEGER     NOT NULL,
        "reason"            VARCHAR(500) NOT NULL,
        "performed_by_id"   UUID,
        "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inventory_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_inventory_logs_item_id"
          FOREIGN KEY ("inventory_item_id")
          REFERENCES "inventory_items" ("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_inventory_logs_item_id" ON "inventory_logs" ("inventory_item_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_inventory_logs_created_at" ON "inventory_logs" ("created_at" DESC)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "inventory_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inventory_items"`);
  }
}
