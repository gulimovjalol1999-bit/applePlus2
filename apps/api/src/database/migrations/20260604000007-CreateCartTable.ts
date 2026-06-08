import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCartTable20260604000007 implements MigrationInterface {
  name = 'CreateCartTable20260604000007';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "carts" (
        "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
        "user_id"    UUID,
        "session_id" VARCHAR(128),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMPTZ,
        CONSTRAINT "PK_carts"        PRIMARY KEY ("id"),
        CONSTRAINT "UQ_carts_user"   UNIQUE ("user_id"),
        CONSTRAINT "FK_carts_user"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "cart_items" (
        "id"         UUID          NOT NULL DEFAULT gen_random_uuid(),
        "cart_id"    UUID          NOT NULL,
        "variant_id" UUID          NOT NULL,
        "quantity"   INTEGER       NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cart_items" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_cart_items_cart_variant" UNIQUE ("cart_id", "variant_id"),
        CONSTRAINT "CHK_cart_items_qty" CHECK ("quantity" > 0),
        CONSTRAINT "FK_cart_items_cart"
          FOREIGN KEY ("cart_id")    REFERENCES "carts"            ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cart_items_variant"
          FOREIGN KEY ("variant_id") REFERENCES "product_variants" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_carts_session_id" ON "carts" ("session_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "cart_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "carts"`);
  }
}
