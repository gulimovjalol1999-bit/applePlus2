import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsersPhoneUniqueIndex20260610000001 implements MigrationInterface {
  name = 'AddUsersPhoneUniqueIndex20260610000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_users_phone" ON "users" ("phone") WHERE "phone" IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_phone"`);
  }
}
