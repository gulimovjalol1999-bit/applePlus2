# Apple Plus — System Architecture

## 1. System Overview

Apple Plus is a production-grade e-commerce platform built on a decoupled frontend/backend architecture with a single PostgreSQL database, reverse-proxied behind Nginx, secured with Let's Encrypt SSL, and deployed via Docker Compose with GitHub Actions CI/CD.

```
                          ┌─────────────────────────────┐
                          │         Internet             │
                          └──────────────┬──────────────┘
                                         │ HTTPS (443)
                          ┌──────────────▼──────────────┐
                          │       Nginx Reverse Proxy    │
                          │   (SSL Termination / Rate    │
                          │    Limiting / Static Assets) │
                          └─────┬───────────────┬────────┘
                                │               │
               ┌────────────────▼──┐   ┌────────▼────────────┐
               │  Next.js Frontend │   │  NestJS Backend API  │
               │  (Port 3000)      │   │  (Port 4000)         │
               │  SSR / SSG / ISR  │   │  REST + Swagger UI   │
               └───────────────────┘   └────────┬────────────┘
                                                 │
                               ┌─────────────────▼──────────────┐
                               │       PostgreSQL Database        │
                               │       (Port 5432)                │
                               └─────────────────────────────────┘
```

---

## 2. Backend Module Architecture (NestJS)

The backend follows a modular monolith pattern — all modules share one process and one database but have strictly defined service boundaries. Each module owns its domain logic and communicates with other modules only through injected services (no direct repository cross-access).

### Module Map

```
AppModule
├── CoreModule           (global: config, logger, database)
├── AuthModule           (JWT, refresh tokens, guards)
├── UsersModule          (user CRUD, profile, addresses)
├── ProductsModule       (catalog, variants, media)
├── CategoriesModule     (tree structure, slugs)
├── BrandsModule         (brand profiles)
├── InventoryModule      (stock tracking, reservations)
├── OrdersModule         (checkout, order lifecycle)
├── PaymentsModule       (gateway integration, webhooks)
├── CartModule           (session/user cart)
├── WishlistModule       (saved products)
├── ReviewsModule        (ratings, moderation)
├── CouponsModule        (discount rules, validation)
├── ShippingModule       (providers, rates, tracking)
├── NotificationsModule  (email, SMS, push via queue)
├── SearchModule         (full-text search, filters)
├── AnalyticsModule      (events, dashboards)
├── AdminModule          (admin-only aggregation layer)
└── HealthModule         (liveness/readiness probes)
```

### Module Internal Structure (per module)

```
users/
├── users.module.ts
├── users.controller.ts       ← HTTP layer, Swagger decorators
├── users.service.ts          ← Business logic
├── users.repository.ts       ← TypeORM query abstraction
├── dto/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   └── user-response.dto.ts
├── entities/
│   └── user.entity.ts
├── guards/
│   └── user-ownership.guard.ts
└── users.constants.ts
```

---

## 3. Frontend Architecture (Next.js App Router)

### Rendering Strategy by Route

| Route | Strategy | Reason |
|---|---|---|
| `/` (home) | ISR (60 s revalidate) | Featured products change slowly |
| `/products/[slug]` | ISR (30 s revalidate) | Price/stock freshness needed |
| `/category/[slug]` | ISR (120 s revalidate) | Catalog stability |
| `/search` | SSR | Dynamic query params |
| `/cart` | CSR | Per-user, no indexing needed |
| `/checkout` | CSR | Private, no cache |
| `/account/**` | CSR | Authenticated, no SEO |
| `/admin/**` | CSR | Internal tooling |

### State Management

| Concern | Solution |
|---|---|
| Server state / data fetching | TanStack Query (React Query) |
| Cart & wishlist | Zustand (persisted to localStorage) |
| Auth session | NextAuth.js (JWT strategy) |
| Form state | React Hook Form + Zod |
| UI state (modals, drawers) | Zustand |

### Component Layers

```
app/                      ← Route segments (layouts, pages, loading, error)
components/
├── ui/                   ← shadcn/ui primitives (Button, Input, Dialog…)
├── layout/               ← Header, Footer, Sidebar, Navbar
├── product/              ← ProductCard, ProductGallery, VariantPicker
├── cart/                 ← CartDrawer, CartItem, MiniCart
├── checkout/             ← StepWizard, AddressForm, PaymentForm
├── account/              ← OrderHistory, AddressBook, ProfileForm
├── admin/                ← DataTable, StatsCard, ChartWrapper
└── shared/               ← Breadcrumbs, Pagination, Rating, Badge
lib/
├── api/                  ← Typed API client (fetch wrappers)
├── hooks/                ← Custom React hooks
├── utils/                ← Formatters, validators, helpers
├── schemas/              ← Zod validation schemas
└── constants/            ← Site config, enums, routes
```

---

## 4. Domain Model

### Core Entities & Relationships

```
User ─────────────────── has many ─── Address
User ─────────────────── has many ─── Order
User ─────────────────── has one  ─── Cart
User ─────────────────── has many ─── Review
User ─────────────────── has many ─── Wishlist

Product ──────────────── belongs to ─ Category (tree)
Product ──────────────── belongs to ─ Brand
Product ──────────────── has many ─── ProductVariant
Product ──────────────── has many ─── ProductImage
Product ──────────────── has many ─── Review
ProductVariant ────────── has one  ─── InventoryItem

Order ─────────────────── has many ─── OrderItem
Order ─────────────────── has one  ─── Payment
Order ─────────────────── has one  ─── Shipment
OrderItem ─────────────── refers to ─ ProductVariant

Cart ──────────────────── has many ─── CartItem
CartItem ──────────────── refers to ─ ProductVariant

Coupon ─────────────────── applied to ─ Order
```

### Key Entity Attributes

**User**: id, email, passwordHash, role (ENUM), firstName, lastName, phone, isEmailVerified, createdAt, updatedAt, deletedAt

**Product**: id, name, slug (unique), description, basePrice, salePrice, status (ENUM: DRAFT/ACTIVE/ARCHIVED), categoryId, brandId, tags[], metaTitle, metaDescription, createdAt, updatedAt

**ProductVariant**: id, productId, sku (unique), name, price, attributes (JSONB: color, size, storage), stock, weight, images[]

**Order**: id, userId, status (ENUM: PENDING/CONFIRMED/PROCESSING/SHIPPED/DELIVERED/CANCELLED/REFUNDED), subtotal, discountAmount, shippingAmount, taxAmount, total, currency, couponId, shippingAddressId, billingAddressId, notes, createdAt, updatedAt

**Payment**: id, orderId, provider, providerTransactionId, amount, currency, status (ENUM: PENDING/PAID/FAILED/REFUNDED), metadata (JSONB), paidAt

**InventoryItem**: id, variantId, quantity, reservedQuantity, reorderLevel, warehouseLocation, updatedAt

---

## 5. Service Boundaries

Each boundary is defined by: what it owns, what it exposes, and what it must NOT access.

| Service | Owns | Exposes | Must NOT touch |
|---|---|---|---|
| AuthService | JWT issuance, token refresh, password hashing | `validateToken()`, `generateTokens()` | User business logic |
| UsersService | User lifecycle, address book | `findById()`, `updateProfile()` | Orders, payments |
| ProductsService | Catalog, variants, images | `findBySlug()`, `search()` | Inventory counts directly |
| InventoryService | Stock counts, reservations | `reserve()`, `release()`, `getStock()` | Product metadata |
| OrdersService | Order state machine | `createOrder()`, `updateStatus()` | Payment processing |
| PaymentsService | Gateway calls, webhook handling | `initiatePayment()`, `handleWebhook()` | Order state mutation |
| CartService | Cart CRUD, price calculation | `addItem()`, `checkout()` | Payment, shipping |
| ShippingService | Rate fetching, label generation | `getRates()`, `createShipment()` | Cart, payment |
| NotificationsService | Message dispatch via queue | `sendEmail()`, `sendSms()` | Business logic |
| SearchService | Full-text + filtered search | `searchProducts()`, `suggest()` | Write operations |

---

## 6. RBAC Architecture

### Roles

| Role | Description |
|---|---|
| `SUPER_ADMIN` | Full platform access, can manage admins |
| `ADMIN` | Product, order, user management; no system config |
| `MODERATOR` | Review moderation, coupon management |
| `SELLER` | (Future) manage own products/inventory |
| `CUSTOMER` | Standard authenticated user |
| `GUEST` | Unauthenticated — read-only public access |

### Permission Matrix (abbreviated)

| Resource | SUPER_ADMIN | ADMIN | MODERATOR | CUSTOMER | GUEST |
|---|---|---|---|---|---|
| Products (read) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Products (write) | ✓ | ✓ | — | — | — |
| Orders (own) | ✓ | ✓ | — | ✓ | — |
| Orders (all) | ✓ | ✓ | — | — | — |
| Users (all) | ✓ | ✓ | — | — | — |
| Reviews (moderate) | ✓ | ✓ | ✓ | — | — |
| Coupons (manage) | ✓ | ✓ | ✓ | — | — |
| System config | ✓ | — | — | — | — |

### Implementation

- **NestJS Guards**: `JwtAuthGuard` (authentication), `RolesGuard` (authorization)
- **Decorator**: `@Roles(Role.ADMIN, Role.SUPER_ADMIN)` on controller methods
- **Row-level**: `UserId` injected from JWT claim; controllers verify `resource.userId === req.user.id` for ownership checks
- **JWT payload**: `{ sub: userId, email, role, iat, exp }`
- **Access token**: 15-minute expiry
- **Refresh token**: 7-day expiry, stored hashed in DB, rotated on each use

---

## 7. API Design Strategy

### Conventions

- Base URL: `/api/v1/`
- All responses wrapped: `{ data, meta, error }`
- Pagination: `?page=1&limit=20` → `meta: { page, limit, total, totalPages }`
- Filtering: `?filter[status]=active&filter[categoryId]=uuid`
- Sorting: `?sort=price&order=asc`
- Field selection: `?fields=id,name,price` (sparse fieldsets)
- Versioning: URI-based (`/v1/`, `/v2/`) — no breaking changes within a version

### Key Endpoint Groups

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /api/v1/products
GET    /api/v1/products/:slug
POST   /api/v1/products                 [ADMIN]
PATCH  /api/v1/products/:id             [ADMIN]
DELETE /api/v1/products/:id             [ADMIN]

GET    /api/v1/categories
GET    /api/v1/categories/:slug/products

GET    /api/v1/cart
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:id
DELETE /api/v1/cart/items/:id

POST   /api/v1/orders
GET    /api/v1/orders
GET    /api/v1/orders/:id
PATCH  /api/v1/orders/:id/cancel

POST   /api/v1/payments/initiate
POST   /api/v1/payments/webhook/:provider

GET    /api/v1/users/me
PATCH  /api/v1/users/me
GET    /api/v1/users/me/orders

GET    /api/v1/search?q=iphone
```

### Swagger

- Available at `/api/docs` in development and staging
- Disabled in production (or protected behind Basic Auth)
- All DTOs annotated with `@ApiProperty()`
- JWT Bearer auth configured globally in Swagger config

### Error Format

```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "No product found with slug: iphone-15-pro",
    "statusCode": 404,
    "timestamp": "2026-06-04T10:00:00Z",
    "path": "/api/v1/products/iphone-15-pro"
  }
}
```

---

## 8. SEO Strategy

### Technical SEO

| Mechanism | Implementation |
|---|---|
| SSR/ISR for product pages | Next.js ISR with 30 s revalidate — pages always indexable |
| Dynamic `<title>` & meta | `generateMetadata()` per route segment |
| Open Graph & Twitter cards | `metadata.openGraph` in each page |
| Canonical URLs | Explicit `<link rel="canonical">` to prevent duplicate content on filter pages |
| Structured Data | JSON-LD schemas: `Product`, `BreadcrumbList`, `Organization`, `Review` |
| XML Sitemap | Auto-generated at `/sitemap.xml` via `next-sitemap` on build |
| Robots.txt | `/robots.txt` — block `/admin`, `/cart`, `/checkout`, `/account` |
| Image optimization | `next/image` with WebP/AVIF, explicit `width/height`, `alt` required |
| Core Web Vitals | Lazy-load below-fold images; preload hero image; avoid layout shift with skeleton placeholders |
| Pagination | `rel="next"` / `rel="prev"` on category/search pages |
| Slug strategy | `/products/[brand]-[model]-[variant]` — keyword-rich, stable URLs |

### URL Structure

```
/                                       → Homepage
/products                               → All products
/products/apple-iphone-16-pro-256gb     → Product detail
/category/smartphones                   → Category listing
/category/smartphones/apple             → Category + brand filter
/brands/apple                           → Brand page
/search?q=iphone+15                     → Search results
/blog/[slug]                            → Content marketing (future)
```

### Performance Targets

- LCP < 2.5 s
- FID / INP < 100 ms
- CLS < 0.1
- Achieved via: ISR pre-rendering, CDN edge caching headers (`Cache-Control: public, s-maxage=60, stale-while-revalidate=300`), font subsetting, critical CSS inlining

---

## 9. Cross-Cutting Concerns

| Concern | Solution |
|---|---|
| Logging | Winston + correlation IDs (`x-request-id` header) |
| Request validation | `class-validator` + `ValidationPipe` (global, `whitelist: true`) |
| Rate limiting | `@nestjs/throttler` — 100 req/min per IP by default |
| CORS | Configured per environment; only frontend origin allowed |
| Security headers | Helmet.js on all responses |
| DB migrations | TypeORM migration files; run on startup in production |
| Environment config | `@nestjs/config` with Joi schema validation at boot |
| Health checks | `/health/live` and `/health/ready` endpoints |
| Async jobs | Bull queue (Redis-backed) for emails, webhooks, heavy processing |
