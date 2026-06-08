import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviewsTable20260604000008 implements MigrationInterface {
  name = 'CreateReviewsTable20260604000008';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
        "product_id"  UUID         NOT NULL,
        "user_id"     UUID         NOT NULL,
        "order_id"    UUID,
        "rating"      SMALLINT     NOT NULL,
        "title"       VARCHAR(200),
        "body"        TEXT,
        "is_approved" BOOLEAN      NOT NULL DEFAULT false,
        "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "deleted_at"  TIMESTAMPTZ,
        CONSTRAINT "PK_reviews"             PRIMARY KEY ("id"),
        CONSTRAINT "UQ_reviews_user_product" UNIQUE ("user_id", "product_id"),
        CONSTRAINT "CHK_reviews_rating"     CHECK ("rating" BETWEEN 1 AND 5),
        CONSTRAINT "FK_reviews_product"
          FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_user"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_order"
          FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_reviews_product_id"  ON "reviews" ("product_id")
        WHERE "deleted_at" IS NULL AND "is_approved" = true
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);
  }
}
