# Apple Plus — PostgreSQL Database Design

---

## 1. Entity Relationship Diagram

### 1.1 High-Level Domain Map

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         APPLE PLUS — DATABASE DOMAINS                        ║
╠══════════════════╦═══════════════════╦═══════════════════╦════════════════════╣
║   IAM            ║   CATALOG         ║   COMMERCE        ║   ENGAGEMENT       ║
║                  ║                   ║                   ║                    ║
║  roles           ║  brands           ║  coupons          ║  reviews           ║
║  permissions     ║  categories ◄──┐  ║  carts            ║  wishlist_items    ║
║  role_permissions║  products ────►brands  cart_items     ║  recently_viewed   ║
║  users           ║  product_variants ║  orders           ╠════════════════════╣
║  addresses       ║  product_images   ║  order_items      ║   ANALYTICS        ║
║  refresh_tokens  ║                   ║  payments         ║                    ║
║                  ║  inventory_items  ║  shipments        ║  analytics_events  ║
║                  ║                   ║                   ╠════════════════════╣
║                  ║                   ║                   ║   CROSS-CUTTING    ║
║                  ║                   ║                   ║                    ║
║                  ║                   ║                   ║  audit_logs        ║
╚══════════════════╩═══════════════════╩═══════════════════╩════════════════════╝
```

### 1.2 Full ERD

```
                    ┌────────────────┐
                    │   permissions  │
                    │ PK id          │
                    │    resource    │
                    │    action      │
                    └───────▲────────┘
                            │ M:N via role_permissions
                    ┌───────┴────────┐
                    │     roles      │
                    │ PK id          │
                    │    name        │
                    └───────┬────────┘
                            │ 1:N
          ┌─────────────────▼──────────────────────────────────┐
          │                   users                             │
          │ PK id  email  password_hash  role (enum)  role_id  │
          │        first_name  last_name  phone                 │
          │        is_email_verified  avatar_url                │
          │        created_at  updated_at  deleted_at           │
          └──┬──────────┬──────────┬──────────┬────────────────┘
             │          │          │           │
           1:N        1:1        1:N          1:N
             │          │          │           │
    ┌────────▼────┐  ┌──▼────────────┐  ┌────▼──────┐  ┌──────────────┐
    │  addresses  │  │refresh_tokens │  │  orders   │  │   reviews    │
    │ PK id       │  │ PK id         │  │ PK id     │  │ PK id        │
    │    user_id  │  │    user_id    │  │   user_id │  │    user_id   │
    │    label    │  │    token_hash │  │   status  │  │    product_id│
    │    city     │  │    expires_at │  │   total   │  │    rating    │
    │    country  │  │    revoked_at │  │   ...     │  │    status    │
    └─────────────┘  └───────────────┘  └────┬──────┘  └─────────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              │              │              │
                            1:N            1:1           1:1
                              │              │              │
                    ┌─────────▼────┐  ┌──────▼──────┐  ┌──▼──────────┐
                    │ order_items  │  │  payments   │  │  shipments  │
                    │ PK id        │  │ PK id       │  │ PK id       │
                    │    order_id  │  │    order_id │  │    order_id │
                    │    variant_id│  │    provider │  │    tracking │
                    │    sku (snap)│  │    status   │  │    status   │
                    │    quantity  │  │    amount   │  │    ...      │
                    └──────┬───────┘  └─────────────┘  └─────────────┘
                           │
                           │ N:1
              ┌────────────▼───────────────────────────────────┐
              │              product_variants                    │
              │ PK id  product_id  sku (unique)  price         │
              │        attributes (JSONB)  is_default           │
              │        is_active                                 │
              └──────┬──────────────────────────┬───────────────┘
                   1:1                         1:N
                     │                           │
          ┌──────────▼──────────┐     ┌─────────▼────────┐
          │   inventory_items   │     │  product_images   │
          │ PK id               │     │ PK id             │
          │    variant_id       │     │    product_id     │
          │    quantity         │     │    variant_id     │
          │    reserved_qty     │     │    url            │
          │    reorder_level    │     │    sort_order     │
          └─────────────────────┘     └──────────────────┘
                           N:1 (to product)
              ┌────────────────────────────────────────────────┐
              │                  products                       │
              │ PK id  category_id  brand_id  name  slug       │
              │        base_price  sale_price  status           │
              │        tags[]  avg_rating  review_count         │
              │        meta_title  created_by_id                │
              │        created_at  updated_at  deleted_at       │
              └────────┬───────────────┬────────────────────────┘
                     N:1              N:1
                       │              │
          ┌────────────▼──┐   ┌───────▼──────────┐
          │  categories   │   │      brands       │
          │ PK id         │   │ PK id             │
          │    parent_id──┘   │    name (unique)  │
          │    name           │    slug (unique)  │
          │    slug           │    is_active      │
          │    sort_order     └───────────────────┘
          │    is_active
          └───────────────┘
                                    (self-referential tree)

  ┌─────────────────────────────────────────────────────────┐
  │                ENGAGEMENT DOMAIN                         │
  │                                                          │
  │  users ──1:N──► wishlist_items ──N:1──► product_variants│
  │  users ──1:N──► recently_viewed ──N:1──► products       │
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │                ANALYTICS DOMAIN                          │
  │                                                          │
  │  analytics_events (partitioned by created_at)           │
  │    user_id (nullable) ──N:1──► users                    │
  │    product_id (nullable) ──N:1──► products              │
  │    order_id (nullable) ──N:1──► orders                  │
  └─────────────────────────────────────────────────────────┘
```

---

## 2. Enum Definitions

All ENUMs are defined as PostgreSQL custom types (CREATE TYPE ... AS ENUM).

```
user_role_enum:
  SUPER_ADMIN | ADMIN | MODERATOR | SELLER | CUSTOMER | GUEST

product_status_enum:
  DRAFT | ACTIVE | ARCHIVED

order_status_enum:
  PENDING | CONFIRMED | PROCESSING | SHIPPED | DELIVERED | CANCELLED | REFUNDED

payment_status_enum:
  PENDING | PAID | FAILED | REFUNDED | PARTIALLY_REFUNDED

shipment_status_enum:
  PREPARING | SHIPPED | IN_TRANSIT | DELIVERED | EXCEPTION

review_status_enum:
  PENDING | APPROVED | REJECTED

coupon_type_enum:
  PERCENTAGE | FIXED_AMOUNT | FREE_SHIPPING

analytics_event_type_enum:
  page.viewed       | product.viewed       | product.added_to_cart
  product.removed_from_cart               | search.performed
  order.initiated   | order.completed      | coupon.applied
  user.registered   | user.logged_in       | wishlist.added
  wishlist.removed  | review.submitted
```

---

## 3. Table Definitions

Naming conventions: snake_case tables (plural), snake_case columns, UUID PKs, audit triad (created_at / updated_at / deleted_at).

---

### 3.1 IAM Domain

#### `roles`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| name | user_role_enum | NOT NULL | — | UNIQUE |
| display_name | VARCHAR(100) | NOT NULL | — | Human-readable label |
| description | TEXT | NULLABLE | — | |
| is_active | BOOLEAN | NOT NULL | true | |
| created_at | TIMESTAMPTZ | NOT NULL | now() | |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | |

Constraints: `UNIQUE (name)`
Notes: Seeded at migration time with all 6 roles. Matches values in `user_role_enum`.

---

#### `permissions`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| resource | VARCHAR(100) | NOT NULL | — | e.g. `products`, `orders`, `users` |
| action | VARCHAR(50) | NOT NULL | — | e.g. `read`, `create`, `update`, `delete`, `moderate`, `manage` |
| description | TEXT | NULLABLE | — | |
| created_at | TIMESTAMPTZ | NOT NULL | now() | |

Constraints: `UNIQUE (resource, action)`
Notes: Seeded at migration time. Represents granular access controls mapping to the permission matrix.

---

#### `role_permissions`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| role_id | UUID | NOT NULL | — | FK → roles.id |
| permission_id | UUID | NOT NULL | — | FK → permissions.id |
| granted_at | TIMESTAMPTZ | NOT NULL | now() | |
| granted_by_id | UUID | NULLABLE | — | FK → users.id |

Constraints: `PRIMARY KEY (role_id, permission_id)`
Foreign Keys:
- `role_id` → `roles.id` ON DELETE CASCADE
- `permission_id` → `permissions.id` ON DELETE CASCADE
- `granted_by_id` → `users.id` ON DELETE SET NULL

---

#### `users`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| email | VARCHAR(255) | NOT NULL | — | UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL | — | bcrypt cost 12 |
| role | user_role_enum | NOT NULL | 'CUSTOMER' | Fast JWT claim; mirrors role_id |
| role_id | UUID | NOT NULL | — | FK → roles.id; authoritative for RBAC |
| first_name | VARCHAR(100) | NOT NULL | — | |
| last_name | VARCHAR(100) | NOT NULL | — | |
| phone | VARCHAR(20) | NULLABLE | — | |
| is_email_verified | BOOLEAN | NOT NULL | false | |
| email_verification_token | VARCHAR(255) | NULLABLE | — | |
| password_reset_token | VARCHAR(255) | NULLABLE | — | |
| password_reset_expires_at | TIMESTAMPTZ | NULLABLE | — | |
| avatar_url | VARCHAR(500) | NULLABLE | — | |
| created_at | TIMESTAMPTZ | NOT NULL | now() | |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | |
| deleted_at | TIMESTAMPTZ | NULLABLE | — | Soft delete |

Constraints: `UNIQUE (email)`
Foreign Keys:
- `role_id` → `roles.id` ON DELETE RESTRICT

Check Constraints: none (role enum handles valid values)

Design Note: `role` (enum) and `role_id` (FK) are kept in sync. The enum column makes JWT validation O(1) without a DB lookup; role_id is the authoritative FK for RBAC joins.

---

#### `addresses`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| user_id | UUID | NOT NULL | — | FK → users.id |
| label | VARCHAR(50) | NULLABLE | — | "Home", "Work" |
| recipient_name | VARCHAR(200) | NOT NULL | — | |
| phone | VARCHAR(20) | NOT NULL | — | |
| address_line1 | VARCHAR(255) | NOT NULL | — | |
| address_line2 | VARCHAR(255) | NULLABLE | — | |
| city | VARCHAR(100) | NOT NULL | — | |
| state | VARCHAR(100) | NOT NULL | — | |
| postal_code | VARCHAR(20) | NOT NULL | — | |
| country | CHAR(2) | NOT NULL | — | ISO 3166-1 alpha-2 |
| is_default | BOOLEAN | NOT NULL | false | |
| created_at | TIMESTAMPTZ | NOT NULL | now() | |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | |

Foreign Keys:
- `user_id` → `users.id` ON DELETE CASCADE

---

#### `refresh_tokens`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| user_id | UUID | NOT NULL | — | FK → users.id |
| token_hash | VARCHAR(255) | NOT NULL | — | UNIQUE; SHA-256 of raw token |
| expires_at | TIMESTAMPTZ | NOT NULL | — | 7 days from issue |
| revoked_at | TIMESTAMPTZ | NULLABLE | — | NULL = active |
| ip_address | INET | NULLABLE | — | |
| user_agent | TEXT | NULLABLE | — | |
| created_at | TIMESTAMPTZ | NOT NULL | now() | |

Constraints: `UNIQUE (token_hash)`
Foreign Keys:
- `user_id` → `users.id` ON DELETE CASCADE

Design Note: Replaces the single `refresh_token_hash` on users; supports multi-device sessions. Rotated on each use (old row revoked, new row inserted).

---

### 3.2 Catalog Domain

#### `brands`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| name | VARCHAR(150) | NOT NULL | — | UNIQUE |
| slug | VARCHAR(200) | NOT NULL | — | UNIQUE |
| description | TEXT | NULLABLE | — | |
| logo_url | VARCHAR(500) | NULLABLE | — | |
| website_url | VARCHAR(500) | NULLABLE | — | |
| is_active | BOOLEAN | NOT NULL | true | |
| created_at | TIMESTAMPTZ | NOT NULL | now() | |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | |
| created_by_id | UUID | NULLABLE | — | FK → users.id |

Constraints: `UNIQUE (name)`, `UNIQUE (slug)`

---

#### `categories`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| parent_id | UUID | NULLABLE | — | FK → categories.id (self-join) |
| name | VARCHAR(150) | NOT NULL | — | |
| slug | VARCHAR(200) | NOT NULL | — | UNIQUE |
| description | TEXT | NULLABLE | — | |
| image_url | VARCHAR(500) | NULLABLE | — | |
| meta_title | VARCHAR(160) | NULLABLE | — | |
| meta_description | VARCHAR(320) | NULLABLE | — | |
| sort_order | INTEGER | NOT NULL | 0 | |
| is_active | BOOLEAN | NOT NULL | true | |
| created_at | TIMESTAMPTZ | NOT NULL | now() | |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | |
| created_by_id | UUID | NULLABLE | — | FK → users.id |

Constraints: `UNIQUE (slug)`
Foreign Keys:
- `parent_id` → `categories.id` ON DELETE SET NULL
- `created_by_id` → `users.id` ON DELETE SET NULL

Design Note: Adjacency list model. Migrate to `ltree` extension if tree depth exceeds 5 levels or recursive CTEs become a measurable bottleneck.

---

#### `products`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| category_id | UUID | NOT NULL | — | FK → categories.id |
| brand_id | UUID | NOT NULL | — | FK → brands.id |
| name | VARCHAR(300) | NOT NULL | — | |
| slug | VARCHAR(350) | NOT NULL | — | UNIQUE |
| description | TEXT | NULLABLE | — | |
| short_description | VARCHAR(500) | NULLABLE | — | Cards / meta |
| base_price | DECIMAL(12,2) | NOT NULL | — | CHECK > 0 |
| sale_price | DECIMAL(12,2) | NULLABLE | — | CHECK > 0 when set |
| status | product_status_enum | NOT NULL | 'DRAFT' | |
| tags | TEXT[] | NOT NULL | '{}' | PostgreSQL array |
| meta_title | VARCHAR(160) | NULLABLE | — | |
| meta_description | VARCHAR(320) | NULLABLE | — | |
| average_rating | DECIMAL(3,2) | NOT NULL | 0.00 | Denormalized; updated via event |
| review_count | INTEGER | NOT NULL | 0 | Denormalized; updated via event |
| created_at | TIMESTAMPTZ | NOT NULL | now() | |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | |
| deleted_at | TIMESTAMPTZ | NULLABLE | — | Soft delete |
| created_by_id | UUID | NULLABLE | — | FK → users.id |
| updated_by_id | UUID | NULLABLE | — | FK → users.id |

Constraints: `UNIQUE (slug)`, `CHECK (base_price > 0)`, `CHECK (sale_price IS NULL OR sale_price > 0)`, `CHECK (average_rating BETWEEN 0 AND 5)`, `CHECK (review_count >= 0)`
Foreign Keys:
- `category_id` → `categories.id` ON DELETE RESTRICT
- `brand_id` → `brands.id` ON DELETE RESTRICT
- `created_by_id` → `users.id` ON DELETE SET NULL
- `updated_by_id` → `users.id` ON DELETE SET NULL

---

#### `product_variants`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| product_id | UUID | NOT NULL | — | FK → products.id |
| sku | VARCHAR(100) | NOT NULL | — | UNIQUE; format: APL-BRAND-MODEL-ATTR |
| name | VARCHAR(200) | NOT NULL | — | e.g. "iPhone 16 Pro – 256 GB – Black" |
| price | DECIMAL(12,2) | NOT NULL | — | CHECK > 0 |
| sale_price | DECIMAL(12,2) | NULLABLE | — | |
| attributes | JSONB | NOT NULL | '{}' | {"color":"Black","storage":"256GB"} |
| weight_kg | DECIMAL(8,3) | NULLABLE | — | kg |
| is_default | BOOLEAN | NOT NULL | false | Exactly one per product should be true |
| is_active | BOOLEAN | NOT NULL | true | |
| created_at | TIMESTAMPTZ | NOT NULL | now() | |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | |

Constraints: `UNIQUE (sku)`, `CHECK (price > 0)`
Foreign Keys:
- `product_id` → `products.id` ON DELETE CASCADE

---

#### `product_images`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| product_id | UUID | NOT NULL | — | FK → products.id |
| variant_id | UUID | NULLABLE | — | FK → product_variants.id |
| url | VARCHAR(500) | NOT NULL | — | |
| alt_text | VARCHAR(255) | NULLABLE | — | |
| sort_order | INTEGER | NOT NULL | 0 | |
| is_primary | BOOLEAN | NOT NULL | false | One primary per product or variant |
| created_at | TIMESTAMPTZ | NOT NULL | now() | |

Foreign Keys:
- `product_id` → `products.id` ON DELETE CASCADE
- `variant_id` → `product_variants.id` ON DELETE CASCADE

---

### 3.3 Inventory Domain

#### `inventory_items`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| variant_id | UUID | NOT NULL | — | FK → product_variants.id; UNIQUE |
| quantity | INTEGER | NOT NULL | 0 | CHECK >= 0; total on-hand |
| reserved_quantity | INTEGER | NOT NULL | 0 | CHECK >= 0; held for pending orders |
| reorder_level | INTEGER | NOT NULL | 5 | Alert threshold |
| warehouse_location | VARCHAR(100) | NULLABLE | — | Bin/aisle reference |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | |

Constraints: `UNIQUE (variant_id)`, `CHECK (quantity >= 0)`, `CHECK (reserved_quantity >= 0)`, `CHECK (reserved_quantity <= quantity)`
Foreign Keys:
- `variant_id` → `product_variants.id` ON DELETE CASCADE

Derived Column (not stored): `available_quantity = quantity - reserved_quantity`

Design Note: All stock mutations (reserve, release, increment) must use `SELECT ... FOR UPDATE` on this row to prevent overselling. Never issue plain UPDATE without the row lock.

---

### 3.4 Commerce Domain

#### `coupons`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| code | VARCHAR(50) | NOT NULL | — | UNIQUE; stored UPPER() via check/trigger |
| type | coupon_type_enum | NOT NULL | — | |
| value | DECIMAL(10,2) | NOT NULL | — | % or fixed amount |
| minimum_order_amount | DECIMAL(12,2) | NULLABLE | — | |
| maximum_discount_amount | DECIMAL(12,2) | NULLABLE | — | Cap for PERCENTAGE type |
| usage_limit | INTEGER | NULLABLE | — | NULL = unlimited |
| usage_count | INTEGER | NOT NULL | 0 | Incremented atomically at order confirmation |
| per_user_limit | INTEGER | NULLABLE | 1 | |
| starts_at | TIMESTAMPTZ | NULLABLE | — | |
| expires_at | TIMESTAMPTZ | NULLABLE | — | |
| is_active | BOOLEAN | NOT NULL | true | |
| applicable_product_ids | UUID[] | NULLABLE | — | NULL = all products |
| applicable_category_ids | UUID[] | NULLABLE | — | NULL = all categories |
| created_at | TIMESTAMPTZ | NOT NULL | now() | |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | |
| created_by_id | UUID | NULLABLE | — | FK → users.id |

Constraints: `UNIQUE (code)`, `CHECK (value > 0)`, `CHECK (usage_count >= 0)`
Foreign Keys:
- `created_by_id` → `users.id` ON DELETE SET NULL

---

#### `carts`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| user_id | UUID | NULLABLE | — | FK → users.id; UNIQUE; NULL = guest |
| session_id | VARCHAR(255) | NULLABLE | — | Guest cart identifier |
| expires_at | TIMESTAMPTZ | NULLABLE | — | Guest cart TTL |
| created_at | TIMESTAMPTZ | NOT NULL | now() | |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | |

Constraints: `UNIQUE (user_id)`
Foreign Keys:
- `user_id` → `users.id` ON DELETE CASCADE

---

#### `cart_items`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| cart_id | UUID | NOT NULL | — | FK → carts.id |
| variant_id | UUID | NOT NULL | — | FK → product_variants.id |
| quantity | INTEGER | NOT NULL | — | CHECK > 0 |
| price_snapshot | DECIMAL(12,2) | NOT NULL | — | Price at time of add |
| created_at | TIMESTAMPTZ | NOT NULL | now() | |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | |

Constraints: `UNIQUE (cart_id, variant_id)`, `CHECK (quantity > 0)`
Foreign Keys:
- `cart_id` → `carts.id` ON DELETE CASCADE
- `variant_id` → `product_variants.id` ON DELETE CASCADE

---

#### `orders`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| order_number | VARCHAR(20) | NOT NULL | — | UNIQUE; APL-YYYYMMDD-NNNNN |
| user_id | UUID | NOT NULL | — | FK → users.id |
| status | order_status_enum | NOT NULL | 'PENDING' | State machine enforced in app |
| subtotal | DECIMAL(12,2) | NOT NULL | — | CHECK >= 0 |
| discount_amount | DECIMAL(12,2) | NOT NULL | 0 | CHECK >= 0 |
| shipping_amount | DECIMAL(12,2) | NOT NULL | 0 | CHECK >= 0 |
| tax_amount | DECIMAL(12,2) | NOT NULL | 0 | CHECK >= 0 |
| total | DECIMAL(12,2) | NOT NULL | — | CHECK >= 0 |
| currency | CHAR(3) | NOT NULL | 'USD' | ISO 4217 |
| coupon_id | UUID | NULLABLE | — | FK → coupons.id |
| coupon_code | VARCHAR(50) | NULLABLE | — | Snapshot at order time |
| shipping_address_id | UUID | NULLABLE | — | FK → addresses.id |
| billing_address_id | UUID | NULLABLE | — | FK → addresses.id |
| shipping_address_snapshot | JSONB | NULLABLE | — | Immutable copy |
| billing_address_snapshot | JSONB | NULLABLE | — | Immutable copy |
| notes | TEXT | NULLABLE | — | Customer notes |
| created_at | TIMESTAMPTZ | NOT NULL | now() | |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | |

Constraints: `UNIQUE (order_number)`, `CHECK (total >= 0)`, `CHECK (subtotal >= 0)`

Order number generation: PostgreSQL sequence `order_number_seq` formatted via trigger as `'APL-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('order_number_seq')::text, 5, '0')`

Foreign Keys:
- `user_id` → `users.id` ON DELETE RESTRICT
- `coupon_id` → `coupons.id` ON DELETE SET NULL
- `shipping_address_id` → `addresses.id` ON DELETE SET NULL
- `billing_address_id` → `addresses.id` ON DELETE SET NULL

---

#### `order_items`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| order_id | UUID | NOT NULL | — | FK → orders.id |
| variant_id | UUID | NOT NULL | — | FK → product_variants.id |
| product_name | VARCHAR(300) | NOT NULL | — | Snapshot |
| variant_name | VARCHAR(200) | NOT NULL | — | Snapshot |
| sku | VARCHAR(100) | NOT NULL | — | Snapshot |
| quantity | INTEGER | NOT NULL | — | CHECK > 0 |
| unit_price | DECIMAL(12,2) | NOT NULL | — | Snapshot at checkout |
| discount_amount | DECIMAL(12,2) | NOT NULL | 0 | CHECK >= 0 |
| total | DECIMAL(12,2) | NOT NULL | — | (unit_price × quantity) − discount_amount |
| attributes | JSONB | NOT NULL | '{}' | Variant attributes snapshot |

Constraints: `CHECK (quantity > 0)`, `CHECK (unit_price >= 0)`, `CHECK (total >= 0)`
Foreign Keys:
- `order_id` → `orders.id` ON DELETE CASCADE
- `variant_id` → `product_variants.id` ON DELETE RESTRICT

Design Note: Product/variant data is snapshotted at order time to ensure order history immutability even after catalog edits or product deletion.

---

#### `payments`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| order_id | UUID | NOT NULL | — | FK → orders.id; UNIQUE |
| provider | VARCHAR(50) | NOT NULL | — | 'stripe', 'paypal' |
| provider_transaction_id | VARCHAR(255) | NULLABLE | — | |
| amount | DECIMAL(12,2) | NOT NULL | — | CHECK > 0 |
| currency | CHAR(3) | NOT NULL | — | |
| status | payment_status_enum | NOT NULL | 'PENDING' | |
| refunded_amount | DECIMAL(12,2) | NOT NULL | 0 | CHECK >= 0 |
| metadata | JSONB | NULLABLE | — | Raw provider response |
| paid_at | TIMESTAMPTZ | NULLABLE | — | |
| created_at | TIMESTAMPTZ | NOT NULL | now() | |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | |

Constraints: `UNIQUE (order_id)`, `CHECK (amount > 0)`, `CHECK (refunded_amount >= 0)`, `CHECK (refunded_amount <= amount)`
Foreign Keys:
- `order_id` → `orders.id` ON DELETE CASCADE

---

#### `shipments`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| order_id | UUID | NOT NULL | — | FK → orders.id; UNIQUE |
| provider | VARCHAR(50) | NOT NULL | — | 'fedex', 'ups', 'dhl' |
| tracking_number | VARCHAR(100) | NULLABLE | — | |
| tracking_url | VARCHAR(500) | NULLABLE | — | |
| status | shipment_status_enum | NOT NULL | 'PREPARING' | |
| estimated_delivery | DATE | NULLABLE | — | |
| shipped_at | TIMESTAMPTZ | NULLABLE | — | |
| delivered_at | TIMESTAMPTZ | NULLABLE | — | |
| created_at | TIMESTAMPTZ | NOT NULL | now() | |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | |

Constraints: `UNIQUE (order_id)`
Foreign Keys:
- `order_id` → `orders.id` ON DELETE CASCADE

---

### 3.5 Engagement Domain

#### `reviews`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| product_id | UUID | NOT NULL | — | FK → products.id |
| user_id | UUID | NOT NULL | — | FK → users.id |
| rating | SMALLINT | NOT NULL | — | CHECK BETWEEN 1 AND 5 |
| title | VARCHAR(200) | NULLABLE | — | |
| body | TEXT | NULLABLE | — | |
| is_verified_purchase | BOOLEAN | NOT NULL | false | Set automatically by order check |
| status | review_status_enum | NOT NULL | 'PENDING' | |
| moderation_note | TEXT | NULLABLE | — | Internal; not exposed in API |
| created_at | TIMESTAMPTZ | NOT NULL | now() | |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | |

Constraints: `UNIQUE (product_id, user_id)`, `CHECK (rating BETWEEN 1 AND 5)`
Foreign Keys:
- `product_id` → `products.id` ON DELETE CASCADE
- `user_id` → `users.id` ON DELETE CASCADE

---

#### `wishlist_items`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| user_id | UUID | NOT NULL | — | FK → users.id |
| variant_id | UUID | NOT NULL | — | FK → product_variants.id |
| created_at | TIMESTAMPTZ | NOT NULL | now() | |

Constraints: `UNIQUE (user_id, variant_id)`
Foreign Keys:
- `user_id` → `users.id` ON DELETE CASCADE
- `variant_id` → `product_variants.id` ON DELETE CASCADE

---

#### `recently_viewed`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| user_id | UUID | NOT NULL | — | FK → users.id |
| product_id | UUID | NOT NULL | — | FK → products.id |
| variant_id | UUID | NULLABLE | — | FK → product_variants.id; last viewed variant |
| view_count | INTEGER | NOT NULL | 1 | Incremented on repeated views |
| viewed_at | TIMESTAMPTZ | NOT NULL | now() | Updated on each view (most recent) |

Constraints: `UNIQUE (user_id, product_id)`
Foreign Keys:
- `user_id` → `users.id` ON DELETE CASCADE
- `product_id` → `products.id` ON DELETE CASCADE
- `variant_id` → `product_variants.id` ON DELETE SET NULL

Design Note: On duplicate view, use `INSERT ... ON CONFLICT (user_id, product_id) DO UPDATE SET viewed_at = now(), view_count = recently_viewed.view_count + 1, variant_id = EXCLUDED.variant_id`. Guests tracked client-side only.

---

### 3.6 Analytics Domain

#### `analytics_events`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | BIGSERIAL | NOT NULL | — | PK; BIGINT for high-volume insert performance |
| event_type | analytics_event_type_enum | NOT NULL | — | |
| user_id | UUID | NULLABLE | — | FK → users.id; NULL for guests |
| session_id | VARCHAR(255) | NULLABLE | — | Client-generated session identifier |
| product_id | UUID | NULLABLE | — | FK → products.id |
| order_id | UUID | NULLABLE | — | FK → orders.id |
| category_id | UUID | NULLABLE | — | FK → categories.id |
| metadata | JSONB | NOT NULL | '{}' | Event-specific payload |
| ip_address | INET | NULLABLE | — | |
| user_agent | TEXT | NULLABLE | — | |
| referrer | TEXT | NULLABLE | — | |
| created_at | TIMESTAMPTZ | NOT NULL | now() | Partition key |

Partitioning: `PARTITION BY RANGE (created_at)` — monthly partitions (e.g. `analytics_events_2026_06`).

Foreign Keys: All soft — no FK constraints on this table to keep insert throughput high. Referential integrity verified by application layer.

Design Note: BIGSERIAL PK preferred over UUID for the high-insert analytics workload. FKs omitted intentionally; analytics data should never block catalog or commerce writes. Use BRIN index on `created_at` for time-range scans.

---

#### `analytics_product_stats` (Materialized View)

Refreshed nightly via cron. Not a base table — defined as:

```
SELECT
  product_id,
  DATE(created_at)                         AS stat_date,
  COUNT(*)  FILTER (WHERE event_type = 'product.viewed')        AS views,
  COUNT(*)  FILTER (WHERE event_type = 'product.added_to_cart') AS add_to_cart_events,
  COUNT(DISTINCT user_id)                                        AS unique_visitors
FROM analytics_events
GROUP BY product_id, DATE(created_at)
```

---

### 3.7 Cross-Cutting

#### `audit_logs`

| Column | Type | Nullability | Default | Notes |
|---|---|---|---|---|
| id | BIGSERIAL | NOT NULL | — | PK |
| table_name | VARCHAR(100) | NOT NULL | — | Which table was changed |
| record_id | UUID | NOT NULL | — | PK value of the affected row |
| action | VARCHAR(10) | NOT NULL | — | INSERT / UPDATE / DELETE |
| old_values | JSONB | NULLABLE | — | Row state before change |
| new_values | JSONB | NULLABLE | — | Row state after change |
| changed_fields | TEXT[] | NULLABLE | — | Column names that changed |
| performed_by_id | UUID | NULLABLE | — | FK → users.id |
| performed_at | TIMESTAMPTZ | NOT NULL | now() | |
| ip_address | INET | NULLABLE | — | |

Constraints: `CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))`
Foreign Keys:
- `performed_by_id` → `users.id` ON DELETE SET NULL

Design Note: Populated by PostgreSQL triggers on sensitive tables: `products`, `product_variants`, `inventory_items`, `orders`, `users`. Not every table needs audit — focus on tables where change history has legal or financial significance.

---

## 4. Relationships

### 4.1 Relationship Summary Table

| From | To | Cardinality | FK Column | ON DELETE |
|---|---|---|---|---|
| users | roles | N:1 | users.role_id | RESTRICT |
| roles | role_permissions | 1:N | role_permissions.role_id | CASCADE |
| permissions | role_permissions | 1:N | role_permissions.permission_id | CASCADE |
| users | addresses | 1:N | addresses.user_id | CASCADE |
| users | refresh_tokens | 1:N | refresh_tokens.user_id | CASCADE |
| users | orders | 1:N | orders.user_id | RESTRICT |
| users | reviews | 1:N | reviews.user_id | CASCADE |
| users | wishlist_items | 1:N | wishlist_items.user_id | CASCADE |
| users | recently_viewed | 1:N | recently_viewed.user_id | CASCADE |
| users | carts | 1:1 | carts.user_id | CASCADE |
| categories | categories | 1:N (self) | categories.parent_id | SET NULL |
| categories | products | 1:N | products.category_id | RESTRICT |
| brands | products | 1:N | products.brand_id | RESTRICT |
| products | product_variants | 1:N | product_variants.product_id | CASCADE |
| products | product_images | 1:N | product_images.product_id | CASCADE |
| products | reviews | 1:N | reviews.product_id | CASCADE |
| products | recently_viewed | 1:N | recently_viewed.product_id | CASCADE |
| product_variants | product_images | 1:N | product_images.variant_id | CASCADE |
| product_variants | inventory_items | 1:1 | inventory_items.variant_id | CASCADE |
| product_variants | cart_items | 1:N | cart_items.variant_id | CASCADE |
| product_variants | order_items | 1:N | order_items.variant_id | RESTRICT |
| product_variants | wishlist_items | 1:N | wishlist_items.variant_id | CASCADE |
| product_variants | recently_viewed | 1:N | recently_viewed.variant_id | SET NULL |
| carts | cart_items | 1:N | cart_items.cart_id | CASCADE |
| orders | order_items | 1:N | order_items.order_id | CASCADE |
| orders | payments | 1:1 | payments.order_id | CASCADE |
| orders | shipments | 1:1 | shipments.order_id | CASCADE |
| orders | addresses | N:1 | orders.shipping_address_id | SET NULL |
| orders | addresses | N:1 | orders.billing_address_id | SET NULL |
| orders | coupons | N:1 | orders.coupon_id | SET NULL |

### 4.2 ON DELETE Policy Rationale

| Policy | Used When |
|---|---|
| `CASCADE` | Child rows are meaningless without the parent (cart_items without a cart, order_items without an order) |
| `RESTRICT` | Deletion must be blocked to preserve data integrity (cannot delete a user with orders, cannot delete a category that has products) |
| `SET NULL` | FK reference becomes optional after deletion (order still valid if referenced address is deleted — snapshot covers it; coupon still valid if coupon record is later soft-archived) |

---

## 5. Index Strategy

### 5.1 Primary Key Indexes (auto-created)

All tables with UUID PKs: B-tree index automatically created by PostgreSQL on `id`.
`analytics_events` and `audit_logs`: B-tree on BIGSERIAL `id`.

### 5.2 Unique Constraint Indexes (auto-created)

| Table | Columns |
|---|---|
| users | email |
| roles | name |
| permissions | (resource, action) |
| refresh_tokens | token_hash |
| brands | name, slug |
| categories | slug |
| products | slug |
| product_variants | sku |
| inventory_items | variant_id |
| carts | user_id |
| orders | order_number |
| payments | order_id |
| shipments | order_id |
| reviews | (product_id, user_id) |
| wishlist_items | (user_id, variant_id) |
| recently_viewed | (user_id, product_id) |
| coupons | code |

### 5.3 Foreign Key Indexes (explicit; PostgreSQL does not auto-create)

```sql
-- users
CREATE INDEX idx_users_role_id          ON users (role_id);
CREATE INDEX idx_users_deleted_at       ON users (deleted_at) WHERE deleted_at IS NOT NULL;

-- addresses
CREATE INDEX idx_addresses_user_id      ON addresses (user_id);
CREATE INDEX idx_addresses_user_default ON addresses (user_id, is_default);

-- refresh_tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens (expires_at) WHERE revoked_at IS NULL;

-- categories
CREATE INDEX idx_categories_parent_id   ON categories (parent_id);
CREATE INDEX idx_categories_is_active   ON categories (is_active) WHERE is_active = true;

-- products
CREATE INDEX idx_products_category_id   ON products (category_id);
CREATE INDEX idx_products_brand_id      ON products (brand_id);
CREATE INDEX idx_products_status        ON products (status);
CREATE INDEX idx_products_deleted_at    ON products (deleted_at) WHERE deleted_at IS NOT NULL;

-- Composite: catalog browsing patterns
CREATE INDEX idx_products_status_price  ON products (status, base_price) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_status_rating ON products (status, average_rating DESC) WHERE deleted_at IS NULL;

-- product_variants
CREATE INDEX idx_variants_product_id    ON product_variants (product_id);
CREATE INDEX idx_variants_product_default ON product_variants (product_id, is_default) WHERE is_default = true;
CREATE INDEX idx_variants_is_active     ON product_variants (product_id, is_active);

-- product_images
CREATE INDEX idx_images_product_id      ON product_images (product_id);
CREATE INDEX idx_images_variant_id      ON product_images (variant_id) WHERE variant_id IS NOT NULL;

-- inventory_items (unique index already covers variant_id lookup)
-- No additional FK indexes needed — variant_id covered by unique constraint index.

-- orders
CREATE INDEX idx_orders_user_id         ON orders (user_id);
CREATE INDEX idx_orders_status          ON orders (status);
CREATE INDEX idx_orders_user_status     ON orders (user_id, status);
CREATE INDEX idx_orders_created_at      ON orders (created_at DESC);
CREATE INDEX idx_orders_coupon_id       ON orders (coupon_id) WHERE coupon_id IS NOT NULL;

-- order_items
CREATE INDEX idx_order_items_order_id   ON order_items (order_id);
CREATE INDEX idx_order_items_variant_id ON order_items (variant_id);

-- payments
CREATE INDEX idx_payments_status        ON payments (status);
CREATE INDEX idx_payments_provider_txn  ON payments (provider_transaction_id) WHERE provider_transaction_id IS NOT NULL;

-- shipments
CREATE INDEX idx_shipments_tracking     ON shipments (tracking_number) WHERE tracking_number IS NOT NULL;

-- reviews
CREATE INDEX idx_reviews_product_id     ON reviews (product_id);
CREATE INDEX idx_reviews_user_id        ON reviews (user_id);
CREATE INDEX idx_reviews_status         ON reviews (status);
CREATE INDEX idx_reviews_product_status_rating ON reviews (product_id, status, rating) WHERE status = 'APPROVED';

-- wishlist_items
CREATE INDEX idx_wishlist_user_id       ON wishlist_items (user_id);
CREATE INDEX idx_wishlist_variant_id    ON wishlist_items (variant_id);

-- recently_viewed
CREATE INDEX idx_recently_viewed_user_at ON recently_viewed (user_id, viewed_at DESC);

-- coupons
CREATE INDEX idx_coupons_is_active      ON coupons (is_active);
CREATE INDEX idx_coupons_expires_at     ON coupons (expires_at) WHERE expires_at IS NOT NULL;

-- audit_logs
CREATE INDEX idx_audit_logs_table_record ON audit_logs (table_name, record_id);
CREATE INDEX idx_audit_logs_performed_at ON audit_logs (performed_at DESC);
CREATE INDEX idx_audit_logs_performed_by ON audit_logs (performed_by_id) WHERE performed_by_id IS NOT NULL;
```

### 5.4 GIN Indexes (JSONB and Array columns)

```sql
-- Full-text product tags search
CREATE INDEX idx_products_tags_gin      ON products USING GIN (tags);

-- Variant attribute filtering (color, storage, size facets)
CREATE INDEX idx_variants_attributes_gin ON product_variants USING GIN (attributes);

-- Coupon applicability scoping
CREATE INDEX idx_coupons_product_ids_gin ON coupons USING GIN (applicable_product_ids)
    WHERE applicable_product_ids IS NOT NULL;
CREATE INDEX idx_coupons_category_ids_gin ON coupons USING GIN (applicable_category_ids)
    WHERE applicable_category_ids IS NOT NULL;

-- Analytics event metadata queries
CREATE INDEX idx_analytics_metadata_gin ON analytics_events USING GIN (metadata);
```

### 5.5 Full-Text Search Indexes

```sql
-- Product name + description search vector
ALTER TABLE products ADD COLUMN search_vector TSVECTOR
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(short_description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'C')
    ) STORED;

CREATE INDEX idx_products_search_vector ON products USING GIN (search_vector);

-- Trigram index for SKU prefix search (autocomplete, admin lookup)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_variants_sku_trgm       ON product_variants USING GIN (sku gin_trgm_ops);
CREATE INDEX idx_orders_number_trgm      ON orders USING GIN (order_number gin_trgm_ops);
```

### 5.6 BRIN Indexes (Time-Series Tables)

```sql
-- Analytics events: large append-only table; BRIN is small and fast for date ranges
CREATE INDEX idx_analytics_events_created_brin ON analytics_events USING BRIN (created_at);

-- Audit logs: append-only; same reasoning
CREATE INDEX idx_audit_logs_performed_brin ON audit_logs USING BRIN (performed_at);
```

### 5.7 Partial Indexes

```sql
-- Active products only (most frequent query path)
CREATE INDEX idx_products_active_slug    ON products (slug) WHERE status = 'ACTIVE' AND deleted_at IS NULL;

-- Pending orders (most operational queries)
CREATE INDEX idx_orders_pending          ON orders (created_at) WHERE status = 'PENDING';

-- Unexpired, active coupons
CREATE INDEX idx_coupons_active_valid    ON coupons (code) WHERE is_active = true AND (expires_at IS NULL OR expires_at > now());

-- Active variants per product
CREATE INDEX idx_variants_active         ON product_variants (product_id) WHERE is_active = true;

-- Pending reviews (moderation queue)
CREATE INDEX idx_reviews_pending         ON reviews (created_at DESC) WHERE status = 'PENDING';
```

### 5.8 Index Summary by Priority

| Priority | Indexes | Reason |
|---|---|---|
| P0 (critical) | All PKs, all unique constraints | Correctness; PostgreSQL enforces these |
| P1 (high) | FK indexes on high-traffic joins (orders/user_id, order_items/order_id, variants/product_id) | Prevent sequential scans on every JOIN |
| P2 (high) | Partial indexes on status filters | The most common WHERE clause in catalog and order queries |
| P3 (medium) | GIN on tags, attributes, search_vector | Faceted search and full-text — used on every product listing page |
| P4 (low) | BRIN on analytics/audit timestamps | Cheap to maintain; range scans across billions of rows |
| P5 (optional) | Trigram on SKU, order_number | Admin search and autocomplete only |

---

## 6. Migration Plan

Migrations are sequenced to respect FK dependency order. Each migration file is named `YYYYMMDDHHMMSS_<description>.sql` and managed via TypeORM CLI.

### Phase 0 — Extensions and Sequences

```
Migration 001 — enable_extensions
  - CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
  - CREATE EXTENSION IF NOT EXISTS "pgcrypto"      -- gen_random_uuid()
  - CREATE EXTENSION IF NOT EXISTS "pg_trgm"       -- trigram search
  - CREATE EXTENSION IF NOT EXISTS "unaccent"       -- accent-insensitive search
  - CREATE SEQUENCE order_number_seq START 1 INCREMENT 1
```

### Phase 1 — Enum Types

```
Migration 002 — create_enum_types
  - CREATE TYPE user_role_enum AS ENUM (...)
  - CREATE TYPE product_status_enum AS ENUM (...)
  - CREATE TYPE order_status_enum AS ENUM (...)
  - CREATE TYPE payment_status_enum AS ENUM (...)
  - CREATE TYPE shipment_status_enum AS ENUM (...)
  - CREATE TYPE review_status_enum AS ENUM (...)
  - CREATE TYPE coupon_type_enum AS ENUM (...)
  - CREATE TYPE analytics_event_type_enum AS ENUM (...)
```

### Phase 2 — IAM Domain (no upstream FKs)

```
Migration 003 — create_roles
  - CREATE TABLE roles
  - CREATE INDEX idx_roles_name (unique index auto-created by constraint)

Migration 004 — create_permissions
  - CREATE TABLE permissions

Migration 005 — create_users
  - CREATE TABLE users
  - All indexes on users

Migration 006 — create_addresses
  - CREATE TABLE addresses
  - All indexes on addresses

Migration 007 — create_refresh_tokens
  - CREATE TABLE refresh_tokens
  - All indexes on refresh_tokens

Migration 008 — create_role_permissions
  - CREATE TABLE role_permissions
  - role_id FK → roles, permission_id FK → permissions, granted_by_id FK → users
```

### Phase 3 — Catalog Domain

```
Migration 009 — create_brands
  - CREATE TABLE brands

Migration 010 — create_categories
  - CREATE TABLE categories (self-referential; parent_id nullable)

Migration 011 — create_products
  - CREATE TABLE products
  - ADD COLUMN search_vector TSVECTOR GENERATED
  - All standard indexes + GIN search_vector + GIN tags

Migration 012 — create_product_variants
  - CREATE TABLE product_variants
  - All indexes + GIN attributes

Migration 013 — create_product_images
  - CREATE TABLE product_images

Migration 014 — add_catalog_created_by_fks
  - ALTER TABLE brands ADD FK created_by_id → users.id
  - ALTER TABLE categories ADD FK created_by_id → users.id
  - ALTER TABLE products ADD FKs created_by_id, updated_by_id → users.id
  (Separated to avoid circular FK at table creation time — users depends on roles,
  which must exist before users, which must exist before these FKs can be added)
```

### Phase 4 — Inventory Domain

```
Migration 015 — create_inventory_items
  - CREATE TABLE inventory_items
```

### Phase 5 — Commerce Domain

```
Migration 016 — create_coupons
  - CREATE TABLE coupons

Migration 017 — create_carts
  - CREATE TABLE carts

Migration 018 — create_cart_items
  - CREATE TABLE cart_items

Migration 019 — create_orders
  - CREATE TABLE orders
  - All indexes on orders

Migration 020 — create_order_items
  - CREATE TABLE order_items

Migration 021 — create_payments
  - CREATE TABLE payments

Migration 022 — create_shipments
  - CREATE TABLE shipments
```

### Phase 6 — Engagement Domain

```
Migration 023 — create_reviews
  - CREATE TABLE reviews
  - All indexes on reviews

Migration 024 — create_wishlist_items
  - CREATE TABLE wishlist_items

Migration 025 — create_recently_viewed
  - CREATE TABLE recently_viewed
```

### Phase 7 — Analytics Domain

```
Migration 026 — create_analytics_events
  - CREATE TABLE analytics_events
    PARTITION BY RANGE (created_at)
  - CREATE TABLE analytics_events_2026_06
    PARTITION OF analytics_events
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01')
  - BRIN index on created_at
  - GIN index on metadata
  Note: Partition creation for future months automated via pg_cron or application startup.

Migration 027 — create_analytics_product_stats_matview
  - CREATE MATERIALIZED VIEW analytics_product_stats ...
  - CREATE UNIQUE INDEX ON analytics_product_stats (product_id, stat_date)
```

### Phase 8 — Audit Infrastructure

```
Migration 028 — create_audit_logs
  - CREATE TABLE audit_logs
  - All indexes on audit_logs

Migration 029 — create_audit_triggers
  - CREATE OR REPLACE FUNCTION fn_audit_trigger() ...
  - CREATE TRIGGER trg_audit_products AFTER INSERT OR UPDATE OR DELETE ON products ...
  - CREATE TRIGGER trg_audit_orders ...
  - CREATE TRIGGER trg_audit_inventory_items ...
  - CREATE TRIGGER trg_audit_users ...
  - CREATE TRIGGER trg_audit_product_variants ...
```

### Phase 9 — Seed Data

```
Migration 030 — seed_roles
  - INSERT INTO roles (name, display_name, description) VALUES
    ('SUPER_ADMIN', 'Super Admin', 'Full platform access'),
    ('ADMIN', ...),
    ('MODERATOR', ...),
    ('SELLER', ...),
    ('CUSTOMER', ...),
    ('GUEST', ...)

Migration 031 — seed_permissions
  - INSERT INTO permissions (resource, action) VALUES
    ('products', 'read'), ('products', 'create'), ('products', 'update'), ('products', 'delete'),
    ('orders', 'read_own'), ('orders', 'read_all'), ('orders', 'update'),
    ('users', 'read_all'), ('users', 'update'),
    ('reviews', 'moderate'),
    ('coupons', 'manage'),
    ('system_config', 'manage'),
    ... (full matrix)

Migration 032 — seed_role_permissions
  - INSERT INTO role_permissions based on permission matrix from ARCHITECTURE.md

Migration 033 — seed_admin_user
  - INSERT INTO users (first admin account using env var credentials)
```

### Migration Dependency Graph

```
001 (extensions)
    └── 002 (enums)
            ├── 003 (roles)
            │       └── 005 (users)
            │               ├── 004 (permissions) → 008 (role_permissions)
            │               ├── 006 (addresses)
            │               ├── 007 (refresh_tokens)
            │               ├── 009 (brands)
            │               │       └── 011 (products) → 014 (catalog FKs)
            │               │               └── 012 (product_variants)
            │               │                       ├── 013 (product_images)
            │               │                       ├── 015 (inventory_items)
            │               │                       ├── 016 (coupons) → 017 (carts) → 018 (cart_items)
            │               │                       ├── 019 (orders) → 020 (order_items)
            │               │                       │       ├── 021 (payments)
            │               │                       │       └── 022 (shipments)
            │               │                       ├── 023 (reviews)
            │               │                       ├── 024 (wishlist_items)
            │               │                       └── 025 (recently_viewed)
            │               └── 010 (categories) → 011 (products)
            └── 026 (analytics_events) → 027 (matview)
                028 (audit_logs) → 029 (triggers)
                030–033 (seeds — run last)
```

---

## 7. Soft Delete Strategy

Tables with `deleted_at`:
- `users` — profiles soft-deleted; hard delete requires GDPR erasure flow
- `products` — archived products remain in order history
- All other tables use `is_active` (boolean) rather than soft delete, since they are either append-only or small enough that hard delete is safe

Enforcement rules:
1. All queries against `users` and `products` in application code must include `WHERE deleted_at IS NULL` unless explicitly auditing deleted records
2. Partial indexes on `(slug) WHERE deleted_at IS NULL` on products prevent slug reuse on active records
3. Cascading deletes on child tables (product_variants, order_items) handle cleanup automatically when a product is hard-deleted via admin purge

---

## 8. Denormalization Register

| Table | Column | Source of Truth | Sync Mechanism |
|---|---|---|---|
| products | average_rating | reviews.rating (AVG) | Trigger or event on review.approved |
| products | review_count | COUNT(reviews) WHERE status='APPROVED' | Trigger or event on review.approved / rejected |
| order_items | product_name, variant_name, sku, attributes | product_variants | Snapshot at order creation — immutable |
| orders | coupon_code | coupons.code | Snapshot at order creation — immutable |
| orders | shipping/billing _address_snapshot | addresses | Snapshot at order creation — immutable |
| users | role (enum) | roles.name | Kept in sync on role change — same transaction |

---

## 9. Constraint and Business Rule Mapping

| Business Rule | Enforced By |
|---|---|
| One review per user per product | `UNIQUE (product_id, user_id)` on reviews |
| One active cart per user | `UNIQUE (user_id)` on carts |
| One inventory record per variant | `UNIQUE (variant_id)` on inventory_items |
| One payment per order | `UNIQUE (order_id)` on payments |
| One shipment per order | `UNIQUE (order_id)` on shipments |
| Stock never negative | `CHECK (quantity >= 0)` + `CHECK (reserved_quantity >= 0)` on inventory_items |
| Reserved never exceeds on-hand | `CHECK (reserved_quantity <= quantity)` on inventory_items |
| Rating is 1–5 | `CHECK (rating BETWEEN 1 AND 5)` on reviews |
| Order total never negative | `CHECK (total >= 0)` on orders |
| SKU globally unique | `UNIQUE (sku)` on product_variants |
| Coupon codes case-insensitive | `UNIQUE (code)` + application UPPER() normalization before insert |
| Product slug unique among active | Partial unique index + application slug generation |
| Order number unique and formatted | `UNIQUE (order_number)` + sequence-backed trigger |
