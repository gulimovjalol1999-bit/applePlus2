import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentsTable20260604000010 implements MigrationInterface {
  name = 'CreatePaymentsTable20260604000010';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "payment_status_enum" AS ENUM (
        'pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id"                  UUID          NOT NULL DEFAULT gen_random_uuid(),
        "order_id"            UUID          NOT NULL,
        "status"              "payment_status_enum" NOT NULL DEFAULT 'pending',
        "provider"            VARCHAR(50)   NOT NULL,
        "provider_payment_id" VARCHAR(255),
        "amount"              DECIMAL(12,2) NOT NULL,
        "currency"            VARCHAR(3)    NOT NULL DEFAULT 'USD',
        "metadata"            JSONB         NOT NULL DEFAULT '{}',
        "paid_at"             TIMESTAMPTZ,
        "created_at"          TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments"              PRIMARY KEY ("id"),
        CONSTRAINT "CHK_payments_amount"      CHECK ("amount" > 0),
        CONSTRAINT "FK_payments_order"
          FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_payments_order_id" ON "payments" ("order_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_status_enum"`);
  }
}
