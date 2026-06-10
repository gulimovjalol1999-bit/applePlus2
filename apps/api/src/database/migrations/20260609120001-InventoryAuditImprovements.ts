import { MigrationInterface, QueryRunner } from 'typeorm';

export class InventoryAuditImprovements20260609120001 implements MigrationInterface {
  name = 'InventoryAuditImprovements20260609120001';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add created_at to inventory_items (backfill with updated_at for existing rows)
    await queryRunner.query(`
      ALTER TABLE "inventory_items"
        ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
    `);

    // Backfill existing rows: approximate created_at from updated_at
    await queryRunner.query(`
      UPDATE "inventory_items" SET "created_at" = "updated_at" WHERE "created_at" = now()
    `);

    // 2. Add event_type enum and column to inventory_logs
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE inventory_event_type AS ENUM (
          'manual',
          'order_reserve',
          'order_release',
          'order_commit'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      ALTER TABLE "inventory_logs"
        ADD COLUMN IF NOT EXISTS "event_type" inventory_event_type NOT NULL DEFAULT 'manual'
    `);

    // 3. Index for filtering logs by performer (admin audit queries)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_inventory_logs_performed_by"
        ON "inventory_logs" ("performed_by_id")
        WHERE "performed_by_id" IS NOT NULL
    `);

    // 4. Index for filtering logs by event type (e.g. all ORDER_COMMIT events)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_inventory_logs_event_type"
        ON "inventory_logs" ("event_type")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_logs_event_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_logs_performed_by"`);
    await queryRunner.query(`ALTER TABLE "inventory_logs" DROP COLUMN IF EXISTS "event_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS inventory_event_type`);
    await queryRunner.query(`ALTER TABLE "inventory_items" DROP COLUMN IF EXISTS "created_at"`);
  }
}
