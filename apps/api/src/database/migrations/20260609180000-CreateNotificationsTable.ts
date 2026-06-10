import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable20260609180000 implements MigrationInterface {
  name = 'CreateNotificationsTable20260609180000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "notification_channel_enum" AS ENUM ('email', 'telegram')
    `);

    await queryRunner.query(`
      CREATE TYPE "notification_status_enum" AS ENUM ('pending', 'sent', 'failed')
    `);

    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM (
        'welcome',
        'order_confirmation',
        'order_status_update',
        'password_reset'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id"               UUID                        NOT NULL DEFAULT gen_random_uuid(),
        "type"             "notification_type_enum"    NOT NULL,
        "channel"          "notification_channel_enum" NOT NULL,
        "recipient"        VARCHAR(255)                NOT NULL,
        "idempotency_key"  VARCHAR(255)                NOT NULL,
        "status"           "notification_status_enum"  NOT NULL DEFAULT 'pending',
        "payload"          JSONB,
        "attempt_count"    INT                         NOT NULL DEFAULT 0,
        "last_attempt_at"  TIMESTAMPTZ,
        "sent_at"          TIMESTAMPTZ,
        "error_message"    TEXT,
        "created_at"       TIMESTAMPTZ                 NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMPTZ                 NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_notifications_idempotency_key" UNIQUE ("idempotency_key")
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_notifications_recipient"   ON "notifications" ("recipient")`);
    await queryRunner.query(`CREATE INDEX "idx_notifications_status"      ON "notifications" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_notifications_created_at"  ON "notifications" ("created_at" DESC)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_channel_enum"`);
  }
}
