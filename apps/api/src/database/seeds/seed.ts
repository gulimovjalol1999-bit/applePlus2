import 'reflect-metadata';
import { AppDataSource } from '../data-source';

// Stable IDs so re-runs are idempotent (ON CONFLICT DO NOTHING)
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
const V = {
  ip16p128:  '8529bb14-fccc-436c-af9d-7f2fed12603b',
  ip16p256:  'd0bc2126-64fb-460d-b223-e34b93d03813',
  ip16p512:  '36eb3975-eba6-4125-9b3e-303f5c047caa',
  ip16p1tb:  '44455dd6-ffc4-4fd2-a08c-9011eed75a15',
  ip16128:   '8ff5068e-aac5-4ff4-8a42-8e2629ea5688',
  ip16256:   '8822f83e-1a4c-4b61-bd07-d6667af26b0f',
  ip16512:   '35b01dd4-795f-4592-ab18-5883db861e19',
  w1042alm:  '6b07a415-76e1-475d-a7e1-da68a5de994b',
  w1046alm:  '94dc1612-a7a0-4579-a8c1-d017f5ff0581',
  w1046tti:  '12e818a1-6496-45ef-8136-93fd9117849e',
  mbp14m4:   'b6a97898-e62a-459b-9cdd-fdd3f59743b2',
  mbp14m4p:  '54c8a481-e681-43af-9ef5-488dc1eff30b',
  ipadA128:  '7184f7c2-dc85-4de9-88a1-6a3f2a37c2f6',
  ipadA256:  '5e64065a-4964-48a2-b1f7-f5c2778b0f6f',
  ap4anc:    'a4a2f8eb-b916-4a0f-bfd5-d9341f480183',
  ip15128:   'ce57825e-0b05-44af-93af-f507fe29e5a5',
  ip15256:   '7c458cbb-97f6-4d30-b87e-d0d81887f4e0',
};

async function seed() {
  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    // ── 1. Categories ─────────────────────────────────────────────────────────
    await qr.query(`
      INSERT INTO categories (id, name, slug, description, sort_order, is_active) VALUES
        ('${C.iphone}',  'iPhone',      'iphone',      'Apple iPhone smartphones',             1, true),
        ('${C.watch}',   'Apple Watch', 'apple-watch', 'Apple Watch smartwatches',             2, true),
        ('${C.macbook}', 'MacBook',     'macbook',     'Apple MacBook laptops',                3, true),
        ('${C.ipad}',    'iPad',        'ipad',        'Apple iPad tablets',                   4, true),
        ('${C.airpods}', 'AirPods',     'airpods',     'Apple AirPods & audio accessories',    5, true),
        ('${C.access}',  'Accessories', 'accessories', 'Cases, cables and other accessories',  6, true)
      ON CONFLICT (slug) DO NOTHING
    `);

    // ── 2. Brand ──────────────────────────────────────────────────────────────
    await qr.query(`
      INSERT INTO brands (id, name, slug, description, logo_url, website_url, is_active) VALUES
        ('${B.apple}', 'Apple', 'apple',
         'Apple Inc. — maker of iPhone, Mac, iPad, Apple Watch and more.',
         'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
         'https://www.apple.com', true)
      ON CONFLICT (slug) DO NOTHING
    `);

    // ── 3. Products ───────────────────────────────────────────────────────────
    await qr.query(`
      INSERT INTO products
        (id, category_id, brand_id, name, slug, short_description, description,
         base_price, sale_price, status, tags, average_rating, review_count)
      VALUES
        ('${P.ip16pro}',  '${C.iphone}',  '${B.apple}',
         'iPhone 16 Pro', 'iphone-16-pro',
         'The most powerful iPhone ever with A18 Pro chip.',
         'iPhone 16 Pro features the groundbreaking A18 Pro chip, a 48 MP Fusion camera, and titanium design.',
         999.00, 949.00, 'active', ARRAY['iphone','pro','a18','titanium','5g'], 4.8, 124),

        ('${P.watch10}',  '${C.watch}',   '${B.apple}',
         'Apple Watch Series 10', 'apple-watch-series-10',
         'The thinnest Apple Watch ever with advanced health sensors.',
         'Apple Watch Series 10 features a larger, thinner display, faster charging, and sleep apnea detection.',
         399.00, NULL, 'active', ARRAY['watch','series10','health','fitness'], 4.7, 89),

        ('${P.mbp14}',    '${C.macbook}', '${B.apple}',
         'MacBook Pro 14"', 'macbook-pro-14',
         'Supercharged by M4 Pro chip for pro-level performance.',
         'MacBook Pro 14" with M4 Pro delivers up to 24-core CPU performance and up to 48 GB unified memory.',
         1999.00, 1849.00, 'active', ARRAY['macbook','m4pro','pro','laptop'], 4.9, 67),

        ('${P.ipadA13}',  '${C.ipad}',    '${B.apple}',
         'iPad Air 13"', 'ipad-air-13',
         'Supercharged by M3 chip with a stunning 13" display.',
         'iPad Air 13" with M3 chip offers all-day battery, Apple Intelligence, and Apple Pencil Pro support.',
         799.00, NULL, 'active', ARRAY['ipad','air','m3','13inch'], 4.6, 45),

        ('${P.airpods4}', '${C.airpods}', '${B.apple}',
         'AirPods 4', 'airpods-4',
         'Reengineered for comfort with Active Noise Cancellation.',
         'AirPods 4 feature a new acoustic architecture, Active Noise Cancellation, and up to 30 hours of battery life.',
         179.00, 159.00, 'active', ARRAY['airpods','anc','audio','wireless'], 4.5, 211),

        ('${P.ip16}',     '${C.iphone}',  '${B.apple}',
         'iPhone 16', 'iphone-16',
         'A18 chip. Camera Control. All-new iPhone 16.',
         'iPhone 16 features the A18 chip, a new Camera Control button, 48 MP Fusion camera, and Action button.',
         799.00, 749.00, 'active', ARRAY['iphone','a18','camera-control','usb-c'], 4.7, 156),

        ('${P.ip15}',     '${C.iphone}',  '${B.apple}',
         'iPhone 15', 'iphone-15',
         'Dynamic Island and 48 MP camera for everyone.',
         'iPhone 15 brings Dynamic Island, a 48 MP main camera, and USB-C connectivity.',
         699.00, 649.00, 'active', ARRAY['iphone','dynamic-island','usb-c','48mp'], 4.6, 198)
      ON CONFLICT (slug) DO NOTHING
    `);

    // ── 4. Product Variants ───────────────────────────────────────────────────
    await qr.query(`
      INSERT INTO product_variants
        (id, product_id, sku, name, price, sale_price, attributes, weight_kg, is_default, is_active)
      VALUES
        ('${V.ip16p128}', '${P.ip16pro}',  'IP16PRO-128-BLK', 'iPhone 16 Pro 128 GB Black Titanium',     999.00,  949.00, '{"storage":"128 GB","color":"Black Titanium"}', 0.199, true,  true),
        ('${V.ip16p256}', '${P.ip16pro}',  'IP16PRO-256-BLK', 'iPhone 16 Pro 256 GB Black Titanium',    1099.00,  NULL,   '{"storage":"256 GB","color":"Black Titanium"}', 0.199, false, true),
        ('${V.ip16p512}', '${P.ip16pro}',  'IP16PRO-512-WHT', 'iPhone 16 Pro 512 GB White Titanium',    1299.00,  NULL,   '{"storage":"512 GB","color":"White Titanium"}', 0.199, false, true),
        ('${V.ip16p1tb}', '${P.ip16pro}',  'IP16PRO-1TB-DST', 'iPhone 16 Pro 1 TB Desert Titanium',     1499.00,  NULL,   '{"storage":"1 TB","color":"Desert Titanium"}',  0.199, false, true),
        ('${V.w1042alm}', '${P.watch10}',  'AW10-42-ALM-BLK', 'Apple Watch S10 42mm Aluminium Jet Black', 399.00, NULL,   '{"size":"42mm","material":"Aluminium","color":"Jet Black"}', 0.036, true,  true),
        ('${V.w1046alm}', '${P.watch10}',  'AW10-46-ALM-SLV', 'Apple Watch S10 46mm Aluminium Silver',    429.00, NULL,   '{"size":"46mm","material":"Aluminium","color":"Silver"}',    0.041, false, true),
        ('${V.w1046tti}', '${P.watch10}',  'AW10-46-TTI-SLT', 'Apple Watch S10 46mm Titanium Slate',      749.00, NULL,   '{"size":"46mm","material":"Titanium","color":"Slate"}',      0.036, false, true),
        ('${V.mbp14m4}',  '${P.mbp14}',    'MBP14-M4-16-512',  'MacBook Pro 14" M4 16GB 512GB',          1999.00, 1849.00,'{"chip":"M4","memory":"16 GB","storage":"512 GB","color":"Space Black"}',  1.55, true,  true),
        ('${V.mbp14m4p}', '${P.mbp14}',    'MBP14-M4P-24-1TB', 'MacBook Pro 14" M4 Pro 24GB 1TB',        2499.00, NULL,   '{"chip":"M4 Pro","memory":"24 GB","storage":"1 TB","color":"Space Black"}', 1.55, false, true),
        ('${V.ipadA128}', '${P.ipadA13}',  'IPADA13-128-BLU',  'iPad Air 13" 128 GB Blue',                799.00, NULL,   '{"storage":"128 GB","color":"Blue","connectivity":"Wi-Fi"}',       0.617, true,  true),
        ('${V.ipadA256}', '${P.ipadA13}',  'IPADA13-256-STG',  'iPad Air 13" 256 GB Starlight',           999.00, NULL,   '{"storage":"256 GB","color":"Starlight","connectivity":"Wi-Fi"}',  0.617, false, true),
        ('${V.ap4anc}',   '${P.airpods4}', 'AP4-ANC-WHT',      'AirPods 4 with ANC White',                179.00, 159.00, '{"color":"White","anc":"Yes"}',                                    0.046, true,  true),
        ('${V.ip16128}',  '${P.ip16}',     'IP16-128-BLK',     'iPhone 16 128 GB Black',                  799.00, 749.00, '{"storage":"128 GB","color":"Black"}',                             0.170, true,  true),
        ('${V.ip16256}',  '${P.ip16}',     'IP16-256-GRN',     'iPhone 16 256 GB Teal',                   899.00, NULL,   '{"storage":"256 GB","color":"Teal"}',                               0.170, false, true),
        ('${V.ip16512}',  '${P.ip16}',     'IP16-512-WHT',     'iPhone 16 512 GB White',                  999.00, NULL,   '{"storage":"512 GB","color":"White"}',                              0.170, false, true),
        ('${V.ip15128}',  '${P.ip15}',     'IP15-128-BLK',     'iPhone 15 128 GB Black',                  699.00, 649.00, '{"storage":"128 GB","color":"Black"}',                             0.171, true,  true),
        ('${V.ip15256}',  '${P.ip15}',     'IP15-256-PNK',     'iPhone 15 256 GB Pink',                   799.00, NULL,   '{"storage":"256 GB","color":"Pink"}',                              0.171, false, true)
      ON CONFLICT (sku) DO NOTHING
    `);

    // ── 5. Product Images ─────────────────────────────────────────────────────
    await qr.query(`
      INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
      SELECT product_id, url, alt_text, sort_order, is_primary
      FROM (VALUES
        ('${P.ip16pro}' ::uuid, 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-blacktitanium', 'iPhone 16 Pro Black Titanium', 0, true),
        ('${P.watch10}' ::uuid, 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MWWM3ref_VW_34FR+watch-case-46-aluminum-jetblack-nc-s10_VW_34FR', 'Apple Watch S10 Jet Black', 0, true),
        ('${P.mbp14}'   ::uuid, 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/mbp14-m4-pro-max-spaceblack-select-202410', 'MacBook Pro 14 Space Black', 0, true),
        ('${P.ipadA13}' ::uuid, 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-air-select-wifi-blue-202405_FMT_WHH', 'iPad Air 13 Blue', 0, true),
        ('${P.airpods4}'::uuid, 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/airpods-4-anc-select-202409', 'AirPods 4 White', 0, true),
        ('${P.ip16}'    ::uuid, 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-finish-select-202409-6-1inch-black', 'iPhone 16 Black', 0, true),
        ('${P.ip15}'    ::uuid, 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-black', 'iPhone 15 Black', 0, true)
      ) AS t(product_id, url, alt_text, sort_order, is_primary)
      WHERE NOT EXISTS (
        SELECT 1 FROM product_images pi WHERE pi.product_id = t.product_id AND pi.is_primary = true
      )
    `);

    // ── 6. Inventory ──────────────────────────────────────────────────────────
    await qr.query(`
      INSERT INTO inventory_items (variant_id, quantity, reserved_quantity, sold_count, reorder_level, warehouse_location)
      VALUES
        ('${V.ip16p128}', 150, 0, 42, 20, 'A1-01'),
        ('${V.ip16p256}',  80, 0, 18, 15, 'A1-02'),
        ('${V.ip16p512}',  40, 0,  7, 10, 'A1-03'),
        ('${V.ip16p1tb}',  20, 0,  3,  5, 'A1-04'),
        ('${V.w1042alm}', 100, 0, 31, 15, 'B2-01'),
        ('${V.w1046alm}',  60, 0, 12, 10, 'B2-02'),
        ('${V.w1046tti}',  25, 0,  5,  5, 'B2-03'),
        ('${V.mbp14m4}',   50, 0, 14,  8, 'C3-01'),
        ('${V.mbp14m4p}',  30, 0,  6,  5, 'C3-02'),
        ('${V.ipadA128}',  70, 0, 19, 10, 'D4-01'),
        ('${V.ipadA256}',  40, 0,  8,  8, 'D4-02'),
        ('${V.ap4anc}',   200, 0, 67, 30, 'E5-01'),
        ('${V.ip16128}',  130, 0, 48, 20, 'A3-01'),
        ('${V.ip16256}',   70, 0, 22, 15, 'A3-02'),
        ('${V.ip16512}',   35, 0,  9, 10, 'A3-03'),
        ('${V.ip15128}',  120, 0, 55, 20, 'A2-01'),
        ('${V.ip15256}',   60, 0, 21, 10, 'A2-02')
      ON CONFLICT (variant_id) DO NOTHING
    `);

    await qr.commitTransaction();
    console.log('✓ Seed data inserted successfully');
  } catch (err) {
    await qr.rollbackTransaction();
    console.error('✗ Seed failed, rolled back:', err);
    process.exit(1);
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

seed();
