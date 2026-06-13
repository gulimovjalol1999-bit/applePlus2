import 'reflect-metadata';
import { AppDataSource } from '../data-source';

// Same IDs used in seed.ts
const C = {
  iphone:  '53d3cce4-4e78-47c9-834e-41d0f901109d',
  watch:   '7ff30ebb-845e-4a1e-b782-85fb4665c0e0',
  macbook: 'cb21c4b8-29ff-4366-a1d8-0c7c17f1179e',
  ipad:    '0eb0fb8d-e96f-45ce-9910-d91bb6a2720f',
  airpods: '062298d8-fa83-4103-bf35-a266b5e359a9',
  access:  '6aa54356-cf8d-4c69-9f15-4865de034c30',
};
const B = { apple: 'f61b53a5-c1ab-4653-8a3e-1d38d8fbdd3c' };
const P = {
  ip16pro:  'a5fb6d5b-1fd0-4b93-8978-7efa9189bd39',
  ip16:     '19d26df6-0d87-4680-a93f-c2fb6c882e36',
  watch10:  'f4c451b4-dc2b-4298-bee4-61cd88e46c13',
  mbp14:    '057737b7-0e8c-4f5c-bd79-3d3c3acbed80',
  ipadA13:  '2180df18-9884-41e0-b77f-bb7d48b64e7e',
  airpods4: '0405fa4f-5eac-4fbd-afa5-130d526c9b55',
  ip15:     'c9d8340e-e067-4c3e-aeba-c99c28f232b8',
};

async function unseed() {
  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    // Deleting products cascades to product_variants, product_images,
    // inventory_items, inventory_logs, reviews and wishlist_items.
    const productIds = Object.values(P).map((id) => `'${id}'`).join(', ');
    await qr.query(`DELETE FROM "products" WHERE "id" IN (${productIds})`);

    await qr.query(`DELETE FROM "brands" WHERE "id" = '${B.apple}'`);

    const categoryIds = Object.values(C).map((id) => `'${id}'`).join(', ');
    await qr.query(`DELETE FROM "categories" WHERE "id" IN (${categoryIds})`);

    await qr.commitTransaction();
    console.log('✓ Seed data removed successfully');
  } catch (err) {
    await qr.rollbackTransaction();
    console.error('✗ Unseed failed, rolled back:', err);
    process.exit(1);
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

unseed();
