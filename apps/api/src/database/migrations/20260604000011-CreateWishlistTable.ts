import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWishlistTable20260604000011 implements MigrationInterface {
  name = 'CreateWishlistTable20260604000011';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "wishlist_items" (
        "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
        "user_id"    UUID        NOT NULL,
        "product_id" UUID        NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wishlist_items"           PRIMARY KEY ("id"),
        CONSTRAINT "UQ_wishlist_user_product"     UNIQUE ("user_id", "product_id"),
        CONSTRAINT "FK_wishlist_items_user"
          FOREIGN KEY ("user_id")    REFERENCES "users"    ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_wishlist_items_product"
          FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_wishlist_user_id" ON "wishlist_items" ("user_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "wishlist_items"`);
  }
}
