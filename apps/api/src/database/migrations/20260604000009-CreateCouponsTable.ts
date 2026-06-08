import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCouponsTable20260604000009 implements MigrationInterface {
  name = 'CreateCouponsTable20260604000009';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "coupon_type_enum" AS ENUM ('percent', 'fixed')
    `);

    await queryRunner.query(`
      CREATE TABLE "coupons" (
        "id"               UUID           NOT NULL DEFAULT gen_random_uuid(),
        "code"             VARCHAR(50)    NOT NULL,
        "type"             "coupon_type_enum" NOT NULL,
        "value"            DECIMAL(12,2)  NOT NULL,
        "min_order_amount" DECIMAL(12,2),
        "max_uses"         INTEGER,
        "used_count"       INTEGER        NOT NULL DEFAULT 0,
        "is_active"        BOOLEAN        NOT NULL DEFAULT true,
        "starts_at"        TIMESTAMPTZ,
        "expires_at"       TIMESTAMPTZ,
        "created_at"       TIMESTAMPTZ    NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMPTZ    NOT NULL DEFAULT now(),
        "deleted_at"       TIMESTAMPTZ,
        CONSTRAINT "PK_coupons"      PRIMARY KEY ("id"),
        CONSTRAINT "UQ_coupons_code" UNIQUE ("code"),
        CONSTRAINT "CHK_coupons_value"     CHECK ("value" > 0),
        CONSTRAINT "CHK_coupons_used"      CHECK ("used_count" >= 0),
        CONSTRAINT "CHK_coupons_max_uses"  CHECK ("max_uses" IS NULL OR "max_uses" > 0)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_coupons_code_active" ON "coupons" ("code")
        WHERE "is_active" = true AND "deleted_at" IS NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "coupons"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "coupon_type_enum"`);
  }
}
