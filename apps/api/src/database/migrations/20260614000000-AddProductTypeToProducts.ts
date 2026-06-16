import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductTypeToProducts20260614000000 implements MigrationInterface {
  name = 'AddProductTypeToProducts20260614000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "product_type_enum" AS ENUM ('new', 'used')
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
        ADD COLUMN "product_type" "product_type_enum" NOT NULL DEFAULT 'new'
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_products_product_type"
        ON "products" ("product_type")
        WHERE "deleted_at" IS NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_product_type"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "product_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "product_type_enum"`);
  }
}
