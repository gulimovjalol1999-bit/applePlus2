# Used Phones Module — Handoff

> Bu fayl yangi Claude Code sessiyasi uchun: "Ishlatilgan telefonlar" (Used Phones) moduli bo'yicha
> hozirgi vaziyat, qabul qilingan arxitektura qarorlari va keyingi bosqichlar.

## Holat: Bosqich 2 — Backend CRUD + audit fixlari TAYYOR

Database/entity qatlami **va** `UsedPhonesModule` (DTO, service, controller, CRUD endpointlar)
yozilgan, so'ngra audit qilingan va topilgan muammolar tuzatilgan (pastga qarang). **Frontend (admin
va customer) — hali yo'q.**

## Arxitektura qarori (tasdiqlangan)

Har bir ishlatilgan telefon = alohida `Product` + aynan 1 ta `ProductVariant` (quantity har doim 1).
Mavjud zanjir o'zgarmaydi: `Product → ProductVariant → InventoryItem`.

Yangi: `InventoryItem ⟷ UsedPhoneDetails` (1:1, FK `used_phone_details.inventory_item_id` →
`inventory_items.id`, ON DELETE CASCADE).

**Nima uchun `InventoryItem`ga, `ProductVariant`ga emas:**
- IMEI, battery health, defects, repair history, purchase cost — bular fizik ombor
  birligining (inventory item) xususiyatlari, katalog/SKU ta'rifining emas.
- `ProductVariant.price`/`salePrice` — sotish narxi (cart/order shu orqali ishlaydi, o'zgarmaydi).
- `used_phone_details.purchase_cost_price` — sotib olingan narx (ichki, marja hisoblash uchun).
- Kelajakda "1 variant = bir nechta fizik birlik" modeliga o'tish kerak bo'lsa (`inventory_items.variant_id`
  unique constraint'ini bo'shatish), `used_phone_details` joyida qoladi — ko'chirish kerak emas.
- `InventoryLog` orqali audit trail (qabul qilindi/sotildi) bepul ishlaydi.

Cart, Order, Payment, Shipping, Inventory, Reviews modullariga **hech qanday o'zgarish kerak emas** —
ular `variant_id` orqali ishlaydi, bu o'zgarmadi.

## Yaratilgan/o'zgartirilgan fayllar

**Yangi enumlar** (`apps/api/src/common/enums/`):
- `product-type.enum.ts` — `ProductType.NEW | USED`
- `used-phone-condition.enum.ts` — `UsedPhoneConditionGrade` (like_new/excellent/good/fair/for_parts)
- `used-phone-warranty.enum.ts` — `UsedPhoneWarrantyType` (none/seller_warranty/apple_warranty_remaining)
- `carrier-lock-status.enum.ts` — `CarrierLockStatus` (unlocked/locked/unknown)

**Yangi entity:**
- `apps/api/src/modules/inventory/entities/used-phone-details.entity.ts` — `UsedPhoneDetails`
  - Maydonlar: `imei` (unique), `imei2`, `serialNumber`, `conditionGrade`, `batteryHealthPercent` (0-100),
    `defects` (jsonb `UsedPhoneDefect[]`), `repairHistory` (jsonb `UsedPhoneRepairRecord[]`),
    `includedAccessories` (text[]), `warrantyType`, `warrantyExpiresAt`, `carrierLockStatus`,
    `region`, `purchaseCostPrice` (>0), `gradeNotes`
  - `UsedPhoneDefect` / `UsedPhoneRepairRecord` interfeyslari shu faylda e'lon qilingan

**O'zgartirilgan entitylar:**
- `inventory-item.entity.ts` — `usedPhoneDetails: UsedPhoneDetails | null` (`@OneToOne`, teskari tomon)
- `product.entity.ts` — `productType: ProductType` ustuni (default `NEW`)

**Yangi migratsiyalar** (`apps/api/src/database/migrations/`):
- `20260614000000-AddProductTypeToProducts.ts` — `products.product_type` ustuni + qisman indeks
- `20260614000001-CreateUsedPhoneDetailsTable.ts` — `used_phone_details` jadvali + 3 enum tur

**Tekshirildi:** `migration:run` ✅, `tsc --noEmit` ✅, `nest build` ✅. Boshqa modul/controller/service
o'zgartirilmagan (entity glob orqali avtomatik tanilinadi, `forFeature` kerak emas).

## Bosqich 2 — UsedPhonesModule (CRUD)

`apps/api/src/modules/used-phones/` — to'liq modul:
- `dto/create-used-phone.dto.ts`, `update-used-phone.dto.ts` (PartialType), `used-phone-filter.dto.ts`,
  `used-phone-response.dto.ts`
- `used-phones.service.ts` — `findAll/findOne/create/update/remove`. `create()` bitta
  `dataSource.transaction()` ichida: Product → ProductImage(lar) → ProductVariant →
  InventoryItem (orqali `InventoryService.createForVariant`) → UsedPhoneDetails.
- `used-phones.controller.ts` — `GET/POST/PATCH/DELETE /used-phones`, hammasi
  `@Roles(OWNER, MANAGER)` bilan himoyalangan (IMEI/serialNumber/purchaseCostPrice faqat shu
  endpointlardan chiqadi, public `/products`da ko'rinmaydi).
- `used-phones.module.ts` — `InventoryModule`ni import qiladi.

## Bosqich 2.1 — Audit fixlari (2026-06-14)

To'liq audit qilindi (architecture/DB consistency/security/edge case), topilgan muammolar tuzatildi:

1. **IMEI soft-delete bilan abadiy bloklanishi (Yuqori)** — yangi migration
   `20260614000002-AddSoftDeleteToUsedPhoneDetails.ts`: `used_phone_details.imei`dagi oddiy
   UNIQUE constraint o'rniga `WHERE deleted_at IS NULL` partial unique index; entity'ga
   `@DeleteDateColumn deletedAt` qo'shildi. `remove()` endi Product **va** UsedPhoneDetails'ni
   bir transaction ichida soft-delete qiladi → o'chirilgan IMEI qayta ishlatilishi mumkin.
   ⚠️ Migration hali DB'da ishga tushirilmagan (`migration:run` qiling).
2. **Soft-delete filtrlari** — `findAll`/`loadByProductId`ga `variant.deleted_at IS NULL` va
   `upd.deleted_at IS NULL` qo'shildi.
3. **InventoryService integratsiyasi** — `create()` endi `inventoryService.createForVariant()`
   orqali ishlaydi; bu metod boshlang'ich qoldiq uchun `InventoryLog` (MANUAL, "Initial stock on
   creation") yozadi (ProductsService.createVariant flow'iga ham foyda).
4. **`InventoryService.setQuantity()`** — yangi metod: pessimistic lock, reservedQuantity/negative
   tekshiruvi, audit log. `update()` quantity o'zgarishini endi shu orqali qiladi.
   `rethrowDbError`ga `23514` (CHECK violation) → `BadRequestException` qo'shildi.
5. **`UsedPhoneFilterDto.status`** — ixtiyoriy status filtri qo'shildi (admin barcha statusni
   ko'rishi mumkin, lekin endi filtrlash ham mumkin).
6. **Public `/products` — `productType`** — `ProductResponseDto`/`ProductFilterDto`ga
   `productType` qo'shildi, `ProductsService.toDto`/`findAll` va `search.service.ts` yangilandi —
   storefrontda used phone'larni "yangi" mahsulotlardan ajratish endi mumkin.

**Hali ochiq (past muhim):** `uniqueSlug`/`rethrowDbError` logikasi `ProductsService` va
`UsedPhonesService`da takrorlangan (DRY) — refactor qilinmadi (scope'dan tashqarida qoldirildi).

## Keyingi bosqichlar (hali bajarilmagan)

1. **Migration ishga tushirish:** `20260614000002-AddSoftDeleteToUsedPhoneDetails.ts` — `migration:run`.
2. **"Sotildi" logikasi:** mavjud `InventoryService` (`commitSale`) orqali quantity 1→0,
   soldCount 0→1, `InventoryLog` yozuvi — used-phone oqimiga ulash kerak (alohida endpoint yoki
   orders flow orqali).
3. **Admin frontend:** sidebar bandi, ro'yxat, ko'p bosqichli forma, rasm yuklash, "Sotildi" tugmasi.
4. **Customer frontend:** nav band, listing+filtrlar, detail sahifa (condition/battery/defects/
   accessories bloklari), IMEI faqat sotib olgandan keyin ko'rsatilsin.
5. **API_SPEC.md** yangilanishi — yangi endpointlar hujjatlashtirilsin.
6. **Frontend storefront `/products`** — yangi `productType` filtridan foydalanib used phone'larni
   alohida bo'lim/badge bilan ko'rsatish.

## Qarorlar (tasdiqlandi, 2026-06-14)

- **IMEI**: faqat OWNER/MANAGER (`/used-phones`). Customer default holatda hech qachon ko'rmaydi.
  Kelajakda — tugallangan xariddan keyin ixtiyoriy "reveal" imkoniyati qo'shilishi mumkin (hali
  implementatsiya qilinmagan, future scope).
- **`purchase_cost_price`**: faqat OWNER/MANAGER. Kelajakda permission-based (granular role/permission
  tizimi joriy etilganda) — hozircha role check yetarli.
- **Storage/color**: `product_variants.attributes` JSONBda qoladi. Faqat filterlash/reporting buni
  talab qilsa, alohida ustunlarga ko'chirish kerak bo'ladi (hozircha kerak emas).