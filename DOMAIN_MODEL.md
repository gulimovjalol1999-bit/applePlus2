# Apple Plus — Domain Model

## Entity Relationship Overview

```
┌──────────────┐        ┌───────────────┐        ┌───────────────┐
│     User     │──1:N──▶│    Address    │        │    Category   │
│              │        └───────────────┘        │  (self-join)  │
│              │──1:1──▶│     Cart      │──N:M──▶└──────┬────────┘
│              │        └───────────────┘               │1:N
│              │──1:N──▶│    Order      │        ┌──────▼────────┐
│              │        └───────┬───────┘        │    Product    │──1:N──▶ ProductImage
│              │──1:N──▶│    Review     │        │               │──1:N──▶ ProductVariant
│              │        └───────────────┘        │               │──N:1──▶ Brand
│              │──1:N──▶│ WishlistItem  │        └───────────────┘
└──────────────┘        └───────────────┘                │
                                                 ┌────────▼───────┐
        ┌───────────────────────────────────────▶│ ProductVariant │
        │                                        └────────┬───────┘
        │                                                 │1:1
        │                                        ┌────────▼───────┐
        │                                        │ InventoryItem  │
        │                                        └────────────────┘
        │
┌───────┴───────┐
│    Order      │──1:N──▶ OrderItem ──▶ ProductVariant
│               │──1:1──▶ Payment
│               │──1:1──▶ Shipment
│               │──N:1──▶ Coupon
│               │──N:1──▶ Address (shipping)
│               │──N:1──▶ Address (billing)
└───────────────┘
```

---

## Entity Definitions

### User

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | |
| passwordHash | VARCHAR(255) | NOT NULL | bcrypt, cost 12 |
| role | ENUM | NOT NULL, default 'CUSTOMER' | SUPER_ADMIN, ADMIN, MODERATOR, CUSTOMER |
| firstName | VARCHAR(100) | NOT NULL | |
| lastName | VARCHAR(100) | NOT NULL | |
| phone | VARCHAR(20) | NULLABLE | |
| isEmailVerified | BOOLEAN | NOT NULL, default false | |
| emailVerificationToken | VARCHAR(255) | NULLABLE | |
| passwordResetToken | VARCHAR(255) | NULLABLE | |
| passwordResetExpiry | TIMESTAMP | NULLABLE | |
| refreshTokenHash | VARCHAR(255) | NULLABLE | Hashed refresh token |
| avatarUrl | VARCHAR(500) | NULLABLE | |
| createdAt | TIMESTAMP | NOT NULL, default now() | |
| updatedAt | TIMESTAMP | NOT NULL, default now() | |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete |

**Indexes**: `email` (unique), `role`, `deletedAt`

---

### Address

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| userId | UUID | FK → User.id, NOT NULL | |
| label | VARCHAR(50) | NULLABLE | e.g. "Home", "Work" |
| recipientName | VARCHAR(200) | NOT NULL | |
| phone | VARCHAR(20) | NOT NULL | |
| addressLine1 | VARCHAR(255) | NOT NULL | |
| addressLine2 | VARCHAR(255) | NULLABLE | |
| city | VARCHAR(100) | NOT NULL | |
| state | VARCHAR(100) | NOT NULL | |
| postalCode | VARCHAR(20) | NOT NULL | |
| country | CHAR(2) | NOT NULL | ISO 3166-1 alpha-2 |
| isDefault | BOOLEAN | NOT NULL, default false | |
| createdAt | TIMESTAMP | NOT NULL | |
| updatedAt | TIMESTAMP | NOT NULL | |

**Indexes**: `userId`, `(userId, isDefault)`

---

### Category

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| parentId | UUID | FK → Category.id, NULLABLE | Self-referential tree |
| name | VARCHAR(150) | NOT NULL | |
| slug | VARCHAR(200) | UNIQUE, NOT NULL | URL-safe identifier |
| description | TEXT | NULLABLE | |
| imageUrl | VARCHAR(500) | NULLABLE | |
| metaTitle | VARCHAR(160) | NULLABLE | |
| metaDescription | VARCHAR(320) | NULLABLE | |
| sortOrder | INTEGER | NOT NULL, default 0 | |
| isActive | BOOLEAN | NOT NULL, default true | |
| createdAt | TIMESTAMP | NOT NULL | |
| updatedAt | TIMESTAMP | NOT NULL | |

**Indexes**: `slug` (unique), `parentId`, `isActive`

**Notes**: Adjacency list for simple trees. Migrate to nested set or ltree extension if depth > 5 or recursive queries become a bottleneck.

---

### Brand

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| name | VARCHAR(150) | UNIQUE, NOT NULL | |
| slug | VARCHAR(200) | UNIQUE, NOT NULL | |
| description | TEXT | NULLABLE | |
| logoUrl | VARCHAR(500) | NULLABLE | |
| websiteUrl | VARCHAR(500) | NULLABLE | |
| isActive | BOOLEAN | NOT NULL, default true | |
| createdAt | TIMESTAMP | NOT NULL | |
| updatedAt | TIMESTAMP | NOT NULL | |

**Indexes**: `slug` (unique)

---

### Product

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| categoryId | UUID | FK → Category.id, NOT NULL | |
| brandId | UUID | FK → Brand.id, NOT NULL | |
| name | VARCHAR(300) | NOT NULL | |
| slug | VARCHAR(350) | UNIQUE, NOT NULL | |
| description | TEXT | NULLABLE | |
| shortDescription | VARCHAR(500) | NULLABLE | Used in cards/meta |
| basePrice | DECIMAL(12,2) | NOT NULL | Lowest variant price |
| salePrice | DECIMAL(12,2) | NULLABLE | Promotional price |
| status | ENUM | NOT NULL, default 'DRAFT' | DRAFT, ACTIVE, ARCHIVED |
| tags | TEXT[] | NOT NULL, default '{}' | PostgreSQL array |
| metaTitle | VARCHAR(160) | NULLABLE | |
| metaDescription | VARCHAR(320) | NULLABLE | |
| averageRating | DECIMAL(3,2) | NOT NULL, default 0 | Denormalized, updated on review |
| reviewCount | INTEGER | NOT NULL, default 0 | Denormalized |
| createdAt | TIMESTAMP | NOT NULL | |
| updatedAt | TIMESTAMP | NOT NULL | |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete |

**Indexes**: `slug` (unique), `categoryId`, `brandId`, `status`, `(status, basePrice)`, GIN on `tags`, `deletedAt`

---

### ProductVariant

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| productId | UUID | FK → Product.id, NOT NULL | |
| sku | VARCHAR(100) | UNIQUE, NOT NULL | |
| name | VARCHAR(200) | NOT NULL | e.g. "iPhone 16 Pro - 256GB - Black" |
| price | DECIMAL(12,2) | NOT NULL | Override from product base price |
| salePrice | DECIMAL(12,2) | NULLABLE | |
| attributes | JSONB | NOT NULL, default '{}' | {"color":"Black","storage":"256GB"} |
| weight | DECIMAL(8,3) | NULLABLE | kg |
| isDefault | BOOLEAN | NOT NULL, default false | First/main variant |
| isActive | BOOLEAN | NOT NULL, default true | |
| createdAt | TIMESTAMP | NOT NULL | |
| updatedAt | TIMESTAMP | NOT NULL | |

**Indexes**: `sku` (unique), `productId`, `(productId, isDefault)`, GIN on `attributes`

---

### ProductImage

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| productId | UUID | FK → Product.id, NOT NULL | |
| variantId | UUID | FK → ProductVariant.id, NULLABLE | Variant-specific image |
| url | VARCHAR(500) | NOT NULL | |
| altText | VARCHAR(255) | NULLABLE | |
| sortOrder | INTEGER | NOT NULL, default 0 | |
| isPrimary | BOOLEAN | NOT NULL, default false | |
| createdAt | TIMESTAMP | NOT NULL | |

**Indexes**: `productId`, `variantId`

---

### InventoryItem

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| variantId | UUID | FK → ProductVariant.id, UNIQUE, NOT NULL | 1:1 |
| quantity | INTEGER | NOT NULL, default 0, CHECK >= 0 | Total on-hand |
| reservedQuantity | INTEGER | NOT NULL, default 0, CHECK >= 0 | Held for pending orders |
| reorderLevel | INTEGER | NOT NULL, default 5 | Alert threshold |
| warehouseLocation | VARCHAR(100) | NULLABLE | Bin/aisle reference |
| updatedAt | TIMESTAMP | NOT NULL | |

**Derived**: `availableQuantity = quantity - reservedQuantity`

**Indexes**: `variantId` (unique)

**Notes**: Stock mutation (reserve/release) must use `SELECT ... FOR UPDATE` or optimistic locking to prevent overselling.

---

### Cart

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| userId | UUID | FK → User.id, UNIQUE, NULLABLE | NULL = guest cart |
| sessionId | VARCHAR(255) | NULLABLE | For guest carts |
| expiresAt | TIMESTAMP | NULLABLE | Guest cart TTL |
| createdAt | TIMESTAMP | NOT NULL | |
| updatedAt | TIMESTAMP | NOT NULL | |

**Indexes**: `userId` (unique), `sessionId`

---

### CartItem

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| cartId | UUID | FK → Cart.id, NOT NULL | |
| variantId | UUID | FK → ProductVariant.id, NOT NULL | |
| quantity | INTEGER | NOT NULL, CHECK > 0 | |
| priceSnapshot | DECIMAL(12,2) | NOT NULL | Price at time of add |
| createdAt | TIMESTAMP | NOT NULL | |
| updatedAt | TIMESTAMP | NOT NULL | |

**Constraints**: UNIQUE `(cartId, variantId)`

**Indexes**: `cartId`, `variantId`

---

### Order

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| orderNumber | VARCHAR(20) | UNIQUE, NOT NULL | Human-readable, e.g. APL-20260604-0001 |
| userId | UUID | FK → User.id, NOT NULL | |
| status | ENUM | NOT NULL, default 'PENDING' | See state machine below |
| subtotal | DECIMAL(12,2) | NOT NULL | Sum of line items |
| discountAmount | DECIMAL(12,2) | NOT NULL, default 0 | |
| shippingAmount | DECIMAL(12,2) | NOT NULL, default 0 | |
| taxAmount | DECIMAL(12,2) | NOT NULL, default 0 | |
| total | DECIMAL(12,2) | NOT NULL | Final charged amount |
| currency | CHAR(3) | NOT NULL, default 'USD' | ISO 4217 |
| couponId | UUID | FK → Coupon.id, NULLABLE | |
| couponCode | VARCHAR(50) | NULLABLE | Snapshot at order time |
| shippingAddressId | UUID | FK → Address.id, NULLABLE | |
| billingAddressId | UUID | FK → Address.id, NULLABLE | |
| shippingAddressSnapshot | JSONB | NULLABLE | Snapshot in case address deleted |
| billingAddressSnapshot | JSONB | NULLABLE | |
| notes | TEXT | NULLABLE | Customer notes |
| createdAt | TIMESTAMP | NOT NULL | |
| updatedAt | TIMESTAMP | NOT NULL | |

**Indexes**: `orderNumber` (unique), `userId`, `status`, `(userId, status)`, `createdAt`

#### Order Status State Machine

```
PENDING ──► CONFIRMED ──► PROCESSING ──► SHIPPED ──► DELIVERED
   │              │              │
   └──────────────┴──────────────┴──► CANCELLED
                                             │
                                             ▼
                                         REFUNDED
```

---

### OrderItem

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| orderId | UUID | FK → Order.id, NOT NULL | |
| variantId | UUID | FK → ProductVariant.id, NOT NULL | |
| productName | VARCHAR(300) | NOT NULL | Snapshot |
| variantName | VARCHAR(200) | NOT NULL | Snapshot |
| sku | VARCHAR(100) | NOT NULL | Snapshot |
| quantity | INTEGER | NOT NULL, CHECK > 0 | |
| unitPrice | DECIMAL(12,2) | NOT NULL | Snapshot |
| discountAmount | DECIMAL(12,2) | NOT NULL, default 0 | |
| total | DECIMAL(12,2) | NOT NULL | |
| attributes | JSONB | NOT NULL, default '{}' | Snapshot |

**Indexes**: `orderId`, `variantId`

**Note**: Product/variant data is snapshotted at order time so order history is immutable even if catalog changes.

---

### Payment

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| orderId | UUID | FK → Order.id, UNIQUE, NOT NULL | |
| provider | VARCHAR(50) | NOT NULL | 'stripe', 'paypal' |
| providerTransactionId | VARCHAR(255) | NULLABLE | |
| amount | DECIMAL(12,2) | NOT NULL | |
| currency | CHAR(3) | NOT NULL | |
| status | ENUM | NOT NULL, default 'PENDING' | PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED |
| refundedAmount | DECIMAL(12,2) | NOT NULL, default 0 | |
| metadata | JSONB | NULLABLE | Raw provider response |
| paidAt | TIMESTAMP | NULLABLE | |
| createdAt | TIMESTAMP | NOT NULL | |
| updatedAt | TIMESTAMP | NOT NULL | |

**Indexes**: `orderId` (unique), `providerTransactionId`, `status`

---

### Shipment

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| orderId | UUID | FK → Order.id, UNIQUE, NOT NULL | |
| provider | VARCHAR(50) | NOT NULL | e.g. 'fedex', 'ups' |
| trackingNumber | VARCHAR(100) | NULLABLE | |
| trackingUrl | VARCHAR(500) | NULLABLE | |
| status | ENUM | NOT NULL | PREPARING, SHIPPED, IN_TRANSIT, DELIVERED, EXCEPTION |
| estimatedDelivery | DATE | NULLABLE | |
| shippedAt | TIMESTAMP | NULLABLE | |
| deliveredAt | TIMESTAMP | NULLABLE | |
| createdAt | TIMESTAMP | NOT NULL | |
| updatedAt | TIMESTAMP | NOT NULL | |

**Indexes**: `orderId` (unique), `trackingNumber`

---

### Review

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| productId | UUID | FK → Product.id, NOT NULL | |
| userId | UUID | FK → User.id, NOT NULL | |
| rating | SMALLINT | NOT NULL, CHECK 1–5 | |
| title | VARCHAR(200) | NULLABLE | |
| body | TEXT | NULLABLE | |
| isVerifiedPurchase | BOOLEAN | NOT NULL, default false | |
| status | ENUM | NOT NULL, default 'PENDING' | PENDING, APPROVED, REJECTED |
| moderationNote | TEXT | NULLABLE | Internal only |
| createdAt | TIMESTAMP | NOT NULL | |
| updatedAt | TIMESTAMP | NOT NULL | |

**Constraints**: UNIQUE `(productId, userId)` — one review per user per product

**Indexes**: `productId`, `userId`, `status`, `(productId, status, rating)`

---

### Coupon

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| code | VARCHAR(50) | UNIQUE, NOT NULL | Case-insensitive |
| type | ENUM | NOT NULL | PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING |
| value | DECIMAL(10,2) | NOT NULL | % or fixed value |
| minimumOrderAmount | DECIMAL(12,2) | NULLABLE | |
| maximumDiscountAmount | DECIMAL(12,2) | NULLABLE | Cap for % coupons |
| usageLimit | INTEGER | NULLABLE | Total uses allowed |
| usageCount | INTEGER | NOT NULL, default 0 | |
| perUserLimit | INTEGER | NULLABLE, default 1 | |
| startsAt | TIMESTAMP | NULLABLE | |
| expiresAt | TIMESTAMP | NULLABLE | |
| isActive | BOOLEAN | NOT NULL, default true | |
| applicableProductIds | UUID[] | NULLABLE | NULL = all products |
| applicableCategoryIds | UUID[] | NULLABLE | NULL = all categories |
| createdAt | TIMESTAMP | NOT NULL | |
| updatedAt | TIMESTAMP | NOT NULL | |

**Indexes**: `code` (unique), `isActive`, `expiresAt`

---

### WishlistItem

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| userId | UUID | FK → User.id, NOT NULL | |
| variantId | UUID | FK → ProductVariant.id, NOT NULL | |
| createdAt | TIMESTAMP | NOT NULL | |

**Constraints**: UNIQUE `(userId, variantId)`

**Indexes**: `userId`, `variantId`

---

## Domain Events

Events emitted by aggregates and consumed by other modules (via Bull queue or NestJS EventEmitter):

| Event | Emitted By | Consumers |
|---|---|---|
| `order.created` | OrdersModule | NotificationsModule (email), InventoryModule (reserve) |
| `order.confirmed` | OrdersModule | NotificationsModule, ShippingModule |
| `order.shipped` | OrdersModule | NotificationsModule |
| `order.delivered` | OrdersModule | NotificationsModule, ReviewsModule (unlock review) |
| `order.cancelled` | OrdersModule | NotificationsModule, InventoryModule (release) |
| `payment.succeeded` | PaymentsModule | OrdersModule (confirm) |
| `payment.failed` | PaymentsModule | OrdersModule (cancel), NotificationsModule |
| `user.registered` | AuthModule | NotificationsModule (welcome email) |
| `review.approved` | ReviewsModule | ProductsModule (update averageRating) |
| `inventory.low_stock` | InventoryModule | NotificationsModule (admin alert) |

---

## Business Rules

### Inventory

- Stock reservation occurs at checkout initiation, not cart add.
- Reservation expires after 15 minutes if payment not completed; stock is automatically released.
- Available stock = `quantity - reservedQuantity`. Negative available stock is never permitted.

### Pricing

- `OrderItem.unitPrice` is snapshotted from `ProductVariant.salePrice ?? ProductVariant.price` at checkout time.
- Price changes after order placement do not affect existing orders.
- Coupon validation occurs server-side at checkout; client-displayed discounts are not trusted.

### Orders

- Orders may only be cancelled if status is `PENDING` or `CONFIRMED`.
- Refund is only possible on `DELIVERED` orders, within 30 days.
- Order number format: `APL-{YYYYMMDD}-{5-digit-seq}` — generated via PostgreSQL sequence.

### Reviews

- A user may only leave one review per product.
- `isVerifiedPurchase` is set to `true` automatically if the user has a `DELIVERED` order containing the product.
- Reviews must be in `APPROVED` status before appearing publicly.

### Coupons

- Coupon codes are case-insensitive.
- Percentage coupons respect `maximumDiscountAmount` if set.
- `usageCount` is incremented atomically at order confirmation (not checkout initiation).
