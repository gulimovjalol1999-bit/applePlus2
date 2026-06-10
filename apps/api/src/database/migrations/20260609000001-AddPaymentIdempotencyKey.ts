import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentIdempotencyKey20260609000001 implements MigrationInterface {
  name = 'AddPaymentIdempotencyKey20260609000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Backfill existing rows with a generated key before adding NOT NULL + UNIQUE
    await queryRunner.query(`
      ALTER TABLE "payments"
        ADD COLUMN IF NOT EXISTS "idempotency_key" VARCHAR(64)
    `);

    await queryRunner.query(`
      UPDATE "payments" SET "idempotency_key" = gen_random_uuid()::text
      WHERE "idempotency_key" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
        ALTER COLUMN "idempotency_key" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_payments_idempotency_key" ON "payments" ("idempotency_key")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_payments_idempotency_key"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN IF EXISTS "idempotency_key"`);
  }
}
