import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoldAtToUsedPhoneDetails20260614000003 implements MigrationInterface {
  name = 'AddSoldAtToUsedPhoneDetails20260614000003';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "used_phone_details"
        ADD COLUMN "sold_at" TIMESTAMPTZ
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "used_phone_details"
        DROP COLUMN "sold_at"
    `);
  }
}
