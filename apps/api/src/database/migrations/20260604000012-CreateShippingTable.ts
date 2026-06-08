import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShippingTable20260604000012 implements MigrationInterface {
  name = 'CreateShippingTable20260604000012';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "shipment_status_enum" AS ENUM (
        'pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "shipments" (
        "id"               UUID         NOT NULL DEFAULT gen_random_uuid(),
        "order_id"         UUID         NOT NULL,
        "carrier"          VARCHAR(100),
        "tracking_number"  VARCHAR(200),
        "status"           "shipment_status_enum" NOT NULL DEFAULT 'pending',
        "estimated_at"     TIMESTAMPTZ,
        "delivered_at"     TIMESTAMPTZ,
        "shipping_address" JSONB        NOT NULL DEFAULT '{}',
        "created_at"       TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_shipments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_shipments_order"
          FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_shipments_order_id" ON "shipments" ("order_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "addresses" (
        "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
        "user_id"      UUID         NOT NULL,
        "label"        VARCHAR(50)  NOT NULL DEFAULT 'Home',
        "full_name"    VARCHAR(200) NOT NULL,
        "phone"        VARCHAR(30)  NOT NULL,
        "address_line" VARCHAR(500) NOT NULL,
        "city"         VARCHAR(150) NOT NULL,
        "region"       VARCHAR(150),
        "postal_code"  VARCHAR(20),
        "country"      VARCHAR(2)   NOT NULL DEFAULT 'UZ',
        "is_default"   BOOLEAN      NOT NULL DEFAULT false,
        "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_addresses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_addresses_user"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_addresses_user_id" ON "addresses" ("user_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "addresses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shipments"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "shipment_status_enum"`);
  }
}
