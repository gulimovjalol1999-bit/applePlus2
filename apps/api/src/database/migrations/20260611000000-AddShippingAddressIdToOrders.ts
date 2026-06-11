import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShippingAddressIdToOrders20260611000000 implements MigrationInterface {
  name = 'AddShippingAddressIdToOrders20260611000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
        ADD COLUMN "shipping_address_id" UUID,
        ADD CONSTRAINT "FK_orders_shipping_address"
          FOREIGN KEY ("shipping_address_id") REFERENCES "addresses" ("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_orders_shipping_address_id"
        ON "orders" ("shipping_address_id")
        WHERE "shipping_address_id" IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_shipping_address_id"`);
    await queryRunner.query(`
      ALTER TABLE "orders"
        DROP CONSTRAINT IF EXISTS "FK_orders_shipping_address",
        DROP COLUMN IF EXISTS "shipping_address_id"
    `);
  }
}
