import { MigrationInterface, QueryRunner } from 'typeorm';

export class InventoryLogFKAndSnapshot20260609120002 implements MigrationInterface {
  name = 'InventoryLogFKAndSnapshot20260609120002';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Snapshot column: preserves audit trail even after user deletion
    await queryRunner.query(`
      ALTER TABLE "inventory_logs"
        ADD COLUMN IF NOT EXISTS "performed_by_email" VARCHAR(255)
    `);

    // 2. Hard FK with ON DELETE SET NULL — keeps referential integrity while
    //    allowing user deletion. The email snapshot above ensures the log stays meaningful.
    await queryRunner.query(`
      ALTER TABLE "inventory_logs"
        ADD CONSTRAINT "FK_inventory_logs_performed_by_id"
        FOREIGN KEY ("performed_by_id")
        REFERENCES "users" ("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "inventory_logs"
        DROP CONSTRAINT IF EXISTS "FK_inventory_logs_performed_by_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "inventory_logs"
        DROP COLUMN IF EXISTS "performed_by_email"
    `);
  }
}
