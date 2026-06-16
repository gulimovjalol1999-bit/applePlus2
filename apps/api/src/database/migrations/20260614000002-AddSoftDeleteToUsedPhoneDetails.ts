import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteToUsedPhoneDetails20260614000002 implements MigrationInterface {
  name = 'AddSoftDeleteToUsedPhoneDetails20260614000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "used_phone_details"
        DROP CONSTRAINT "UQ_used_phone_details_imei"
    `);

    await queryRunner.query(`
      ALTER TABLE "used_phone_details"
        ADD COLUMN "deleted_at" TIMESTAMPTZ
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_used_phone_details_imei"
        ON "used_phone_details" ("imei")
        WHERE "deleted_at" IS NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_used_phone_details_imei"
    `);

    await queryRunner.query(`
      ALTER TABLE "used_phone_details"
        DROP COLUMN "deleted_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "used_phone_details"
        ADD CONSTRAINT "UQ_used_phone_details_imei" UNIQUE ("imei")
    `);
  }
}
