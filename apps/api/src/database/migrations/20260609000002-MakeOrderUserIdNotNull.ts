import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeOrderUserIdNotNull20260609000002 implements MigrationInterface {
  name = 'MakeOrderUserIdNotNull20260609000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Safety guard: if any orders have a null user_id this migration will fail,
    // preventing silent data loss. Investigate and resolve orphaned orders first.
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_user"`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "user_id" SET NOT NULL`);
    await queryRunner.query(`
      ALTER TABLE "orders"
        ADD CONSTRAINT "FK_orders_user"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_user"`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "user_id" DROP NOT NULL`);
    await queryRunner.query(`
      ALTER TABLE "orders"
        ADD CONSTRAINT "FK_orders_user"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL
    `);
  }
}
