import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsedPhoneDetailsTable20260614000001 implements MigrationInterface {
  name = 'CreateUsedPhoneDetailsTable20260614000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "used_phone_condition_grade_enum" AS ENUM (
        'like_new', 'excellent', 'good', 'fair', 'for_parts'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "used_phone_warranty_type_enum" AS ENUM (
        'none', 'seller_warranty', 'apple_warranty_remaining'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "carrier_lock_status_enum" AS ENUM ('unlocked', 'locked', 'unknown')
    `);

    await queryRunner.query(`
      CREATE TABLE "used_phone_details" (
        "id"                       UUID                              NOT NULL DEFAULT gen_random_uuid(),
        "inventory_item_id"        UUID                              NOT NULL,
        "imei"                     VARCHAR(20)                       NOT NULL,
        "imei2"                    VARCHAR(20),
        "serial_number"            VARCHAR(100),
        "condition_grade"          "used_phone_condition_grade_enum" NOT NULL,
        "battery_health_percent"   SMALLINT                          NOT NULL,
        "defects"                  JSONB                             NOT NULL DEFAULT '[]',
        "repair_history"           JSONB                             NOT NULL DEFAULT '[]',
        "included_accessories"     TEXT[]                            NOT NULL DEFAULT '{}',
        "warranty_type"            "used_phone_warranty_type_enum"   NOT NULL DEFAULT 'none',
        "warranty_expires_at"      TIMESTAMPTZ,
        "carrier_lock_status"      "carrier_lock_status_enum"        NOT NULL DEFAULT 'unknown',
        "region"                   VARCHAR(50),
        "purchase_cost_price"      DECIMAL(12,2)                     NOT NULL,
        "grade_notes"              TEXT,
        "created_at"               TIMESTAMPTZ                       NOT NULL DEFAULT now(),
        "updated_at"               TIMESTAMPTZ                       NOT NULL DEFAULT now(),
        CONSTRAINT "PK_used_phone_details" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_used_phone_details_inventory_item_id" UNIQUE ("inventory_item_id"),
        CONSTRAINT "UQ_used_phone_details_imei" UNIQUE ("imei"),
        CONSTRAINT "CHK_used_phone_details_battery_health"
          CHECK ("battery_health_percent" BETWEEN 0 AND 100),
        CONSTRAINT "CHK_used_phone_details_purchase_cost_price"
          CHECK ("purchase_cost_price" > 0),
        CONSTRAINT "FK_used_phone_details_inventory_item"
          FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_used_phone_details_condition_grade"
        ON "used_phone_details" ("condition_grade")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "used_phone_details"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "carrier_lock_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "used_phone_warranty_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "used_phone_condition_grade_enum"`);
  }
}
