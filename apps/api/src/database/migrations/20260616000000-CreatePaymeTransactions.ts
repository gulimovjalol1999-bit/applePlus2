import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymeTransactions20260616000000 implements MigrationInterface {
  name = 'CreatePaymeTransactions20260616000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "payme_transactions" (
        "id"                 UUID         NOT NULL DEFAULT gen_random_uuid(),
        "payme_id"           VARCHAR(64)  NOT NULL,
        "order_id"           UUID         NOT NULL,
        "amount"             BIGINT       NOT NULL,
        "state"              SMALLINT     NOT NULL DEFAULT 1,
        "payme_create_time"  BIGINT       NOT NULL DEFAULT 0,
        "perform_time"       BIGINT       NOT NULL DEFAULT 0,
        "cancel_time"        BIGINT       NOT NULL DEFAULT 0,
        "reason"             INT,
        "created_at"         TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at"         TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "deleted_at"         TIMESTAMPTZ,
        CONSTRAINT "PK_payme_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payme_transactions_payme_id" UNIQUE ("payme_id"),
        CONSTRAINT "FK_payme_transactions_order"
          FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_payme_transactions_order_id"
        ON "payme_transactions" ("order_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "payme_transactions"`);
  }
}
