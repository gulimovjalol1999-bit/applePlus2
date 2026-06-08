import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable20260604000001 implements MigrationInterface {
  name = 'CreateUsersTable20260604000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('owner', 'manager', 'operator', 'warehouse', 'customer')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"                  UUID          NOT NULL DEFAULT gen_random_uuid(),
        "email"               VARCHAR(254)  NOT NULL,
        "password_hash"       VARCHAR(100)  NOT NULL,
        "first_name"          VARCHAR(100)  NOT NULL,
        "last_name"           VARCHAR(100)  NOT NULL,
        "phone"               VARCHAR(30),
        "role"                "user_role_enum" NOT NULL DEFAULT 'customer',
        "is_active"           BOOLEAN       NOT NULL DEFAULT true,
        "refresh_token_hash"  VARCHAR(500),
        "email_verified_at"   TIMESTAMPTZ,
        "created_at"          TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "deleted_at"          TIMESTAMPTZ,
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_email" ON "users" ("email")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_role" ON "users" ("role")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
