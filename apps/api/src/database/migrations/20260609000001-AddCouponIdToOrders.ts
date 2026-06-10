import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCouponIdToOrders20260609000001 implements MigrationInterface {
  name = 'AddCouponIdToOrders20260609000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
        ADD COLUMN "coupon_id" UUID,
        ADD CONSTRAINT "FK_orders_coupon"
          FOREIGN KEY ("coupon_id") REFERENCES "coupons" ("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_orders_coupon_id"
        ON "orders" ("coupon_id")
        WHERE "coupon_id" IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_coupon_id"`);
    await queryRunner.query(`
      ALTER TABLE "orders"
        DROP CONSTRAINT IF EXISTS "FK_orders_coupon",
        DROP COLUMN IF EXISTS "coupon_id"
    `);
  }
}
