import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtToCartTables20260611000001
  implements MigrationInterface
{
  name = 'AddDeletedAtToCartTables20260611000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "carts" ADD COLUMN "deleted_at" TIMESTAMPTZ
    `);
    await queryRunner.query(`
      ALTER TABLE "cart_items" ADD COLUMN "deleted_at" TIMESTAMPTZ
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cart_items" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "carts" DROP COLUMN "deleted_at"`);
  }
}
