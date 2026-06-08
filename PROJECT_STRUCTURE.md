# Apple Plus — Folder Structure

## Root

```
apple-plus/
├── apps/
│   ├── api/                    ← NestJS backend
│   └── web/                    ← Next.js frontend
├── packages/
│   ├── shared-types/           ← TypeScript interfaces shared across apps
│   └── ui-kit/                 ← (Optional) shared component library
├── infra/
│   ├── nginx/
│   ├── docker/
│   └── ssl/
├── .github/
│   └── workflows/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── README.md
```

> Monorepo managed with **pnpm workspaces**. Each `apps/*` is an independent deployable unit.

---

## Backend: `apps/api/`

```
apps/api/
├── src/
│   ├── main.ts                          ← Bootstrap, Swagger setup
│   ├── app.module.ts                    ← Root module
│   │
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── mail.config.ts
│   │   └── redis.config.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   ├── current-user.decorator.ts
│   │   │   └── api-paginated-response.decorator.ts
│   │   ├── dto/
│   │   │   ├── pagination.dto.ts
│   │   │   └── base-response.dto.ts
│   │   ├── entities/
│   │   │   └── base.entity.ts           ← id, createdAt, updatedAt, deletedAt
│   │   ├── enums/
│   │   │   ├── role.enum.ts
│   │   │   ├── order-status.enum.ts
│   │   │   └── payment-status.enum.ts
│   │   ├── exceptions/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── business-exception.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/
│   │   │   ├── response-transform.interceptor.ts
│   │   │   ├── logging.interceptor.ts
│   │   │   └── request-id.interceptor.ts
│   │   ├── pipes/
│   │   │   └── parse-uuid.pipe.ts
│   │   └── utils/
│   │       ├── slug.util.ts
│   │       ├── hash.util.ts
│   │       └── pagination.util.ts
│   │
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── migrations/
│   │   │   └── YYYYMMDDHHMMSS-CreateUsersTable.ts
│   │   └── seeds/
│   │       ├── seed.ts
│   │       └── data/
│   │           ├── categories.seed.ts
│   │           └── admin-user.seed.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── jwt-refresh.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       ├── register.dto.ts
│   │   │       └── token-response.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── entities/
│   │   │   │   ├── user.entity.ts
│   │   │   │   └── address.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       ├── update-user.dto.ts
│   │   │       ├── create-address.dto.ts
│   │   │       └── user-response.dto.ts
│   │   │
│   │   ├── products/
│   │   │   ├── products.module.ts
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   ├── products.repository.ts
│   │   │   ├── entities/
│   │   │   │   ├── product.entity.ts
│   │   │   │   ├── product-variant.entity.ts
│   │   │   │   └── product-image.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-product.dto.ts
│   │   │       ├── update-product.dto.ts
│   │   │       ├── product-filter.dto.ts
│   │   │       └── product-response.dto.ts
│   │   │
│   │   ├── categories/
│   │   │   ├── categories.module.ts
│   │   │   ├── categories.controller.ts
│   │   │   ├── categories.service.ts
│   │   │   ├── entities/
│   │   │   │   └── category.entity.ts   ← adjacency list / nested set
│   │   │   └── dto/
│   │   │
│   │   ├── brands/
│   │   │   ├── brands.module.ts
│   │   │   ├── brands.controller.ts
│   │   │   ├── brands.service.ts
│   │   │   ├── entities/
│   │   │   │   └── brand.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── inventory/
│   │   │   ├── inventory.module.ts
│   │   │   ├── inventory.service.ts
│   │   │   ├── entities/
│   │   │   │   └── inventory-item.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── cart/
│   │   │   ├── cart.module.ts
│   │   │   ├── cart.controller.ts
│   │   │   ├── cart.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── cart.entity.ts
│   │   │   │   └── cart-item.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── orders/
│   │   │   ├── orders.module.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.service.ts
│   │   │   ├── orders.repository.ts
│   │   │   ├── entities/
│   │   │   │   ├── order.entity.ts
│   │   │   │   └── order-item.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── payments/
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.controller.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── providers/
│   │   │   │   ├── stripe.provider.ts
│   │   │   │   └── payment-provider.interface.ts
│   │   │   ├── entities/
│   │   │   │   └── payment.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── reviews/
│   │   │   ├── reviews.module.ts
│   │   │   ├── reviews.controller.ts
│   │   │   ├── reviews.service.ts
│   │   │   ├── entities/
│   │   │   │   └── review.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── coupons/
│   │   │   ├── coupons.module.ts
│   │   │   ├── coupons.controller.ts
│   │   │   ├── coupons.service.ts
│   │   │   ├── entities/
│   │   │   │   └── coupon.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── shipping/
│   │   │   ├── shipping.module.ts
│   │   │   ├── shipping.service.ts
│   │   │   ├── entities/
│   │   │   │   └── shipment.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── wishlist/
│   │   │   ├── wishlist.module.ts
│   │   │   ├── wishlist.controller.ts
│   │   │   ├── wishlist.service.ts
│   │   │   ├── entities/
│   │   │   │   └── wishlist-item.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── processors/
│   │   │   │   ├── email.processor.ts
│   │   │   │   └── sms.processor.ts
│   │   │   └── templates/
│   │   │       ├── order-confirmed.hbs
│   │   │       └── password-reset.hbs
│   │   │
│   │   ├── search/
│   │   │   ├── search.module.ts
│   │   │   ├── search.controller.ts
│   │   │   └── search.service.ts
│   │   │
│   │   └── health/
│   │       ├── health.module.ts
│   │       └── health.controller.ts
│   │
│   └── swagger/
│       └── swagger.config.ts
│
├── test/
│   ├── unit/
│   │   └── products/
│   │       └── products.service.spec.ts
│   ├── integration/
│   │   └── auth/
│   │       └── auth.e2e-spec.ts
│   └── fixtures/
│
├── Dockerfile
├── .env.example
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

---

## Frontend: `apps/web/`

```
apps/web/
├── app/
│   ├── layout.tsx                       ← Root layout (fonts, providers)
│   ├── page.tsx                         ← Homepage (ISR)
│   ├── loading.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   │
│   ├── (shop)/                          ← Route group: public shop
│   │   ├── products/
│   │   │   ├── page.tsx                 ← Product listing (ISR)
│   │   │   └── [slug]/
│   │   │       ├── page.tsx             ← Product detail (ISR)
│   │   │       └── loading.tsx
│   │   ├── category/
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── brands/
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   └── search/
│   │       └── page.tsx                 ← SSR
│   │
│   ├── (auth)/                          ← Route group: auth pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── forgot-password/
│   │       └── page.tsx
│   │
│   ├── (protected)/                     ← Route group: requires auth
│   │   ├── cart/
│   │   │   └── page.tsx
│   │   ├── checkout/
│   │   │   ├── page.tsx
│   │   │   └── confirmation/
│   │   │       └── page.tsx
│   │   └── account/
│   │       ├── layout.tsx
│   │       ├── page.tsx                 ← Profile
│   │       ├── orders/
│   │       │   ├── page.tsx
│   │       │   └── [id]/
│   │       │       └── page.tsx
│   │       ├── addresses/
│   │       │   └── page.tsx
│   │       └── wishlist/
│   │           └── page.tsx
│   │
│   └── admin/                           ← Admin dashboard (CSR)
│       ├── layout.tsx
│       ├── page.tsx                     ← Dashboard overview
│       ├── products/
│       │   ├── page.tsx
│       │   ├── new/
│       │   │   └── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       ├── orders/
│       │   └── page.tsx
│       ├── users/
│       │   └── page.tsx
│       └── analytics/
│           └── page.tsx
│
├── components/
│   ├── ui/                              ← shadcn/ui components (generated)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── table.tsx
│   │   └── ...
│   │
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   ├── MobileMenu.tsx
│   │   └── AdminSidebar.tsx
│   │
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductGallery.tsx
│   │   ├── VariantPicker.tsx
│   │   ├── PriceDisplay.tsx
│   │   ├── StockBadge.tsx
│   │   └── ProductFilters.tsx
│   │
│   ├── cart/
│   │   ├── CartDrawer.tsx
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   └── AddToCartButton.tsx
│   │
│   ├── checkout/
│   │   ├── CheckoutStepper.tsx
│   │   ├── AddressStep.tsx
│   │   ├── ShippingStep.tsx
│   │   └── PaymentStep.tsx
│   │
│   ├── account/
│   │   ├── OrderCard.tsx
│   │   ├── OrderTimeline.tsx
│   │   ├── AddressCard.tsx
│   │   └── ProfileForm.tsx
│   │
│   ├── admin/
│   │   ├── DataTable.tsx
│   │   ├── StatsCard.tsx
│   │   ├── ProductForm.tsx
│   │   └── OrderStatusSelect.tsx
│   │
│   └── shared/
│       ├── Breadcrumbs.tsx
│       ├── Pagination.tsx
│       ├── StarRating.tsx
│       ├── ImageUpload.tsx
│       ├── SearchBar.tsx
│       └── EmptyState.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts                    ← Configured fetch client
│   │   ├── products.api.ts
│   │   ├── orders.api.ts
│   │   ├── cart.api.ts
│   │   ├── auth.api.ts
│   │   └── users.api.ts
│   │
│   ├── hooks/
│   │   ├── useCart.ts
│   │   ├── useWishlist.ts
│   │   ├── useProducts.ts
│   │   ├── useOrders.ts
│   │   └── useDebounce.ts
│   │
│   ├── stores/
│   │   ├── cart.store.ts                ← Zustand
│   │   ├── wishlist.store.ts
│   │   └── ui.store.ts
│   │
│   ├── schemas/
│   │   ├── checkout.schema.ts           ← Zod
│   │   ├── address.schema.ts
│   │   └── auth.schema.ts
│   │
│   ├── utils/
│   │   ├── currency.ts
│   │   ├── date.ts
│   │   ├── string.ts
│   │   └── seo.ts
│   │
│   └── constants/
│       ├── routes.ts
│       ├── site.ts
│       └── query-keys.ts
│
├── public/
│   ├── images/
│   ├── icons/
│   ├── robots.txt
│   └── sitemap.xml                      ← Generated at build
│
├── styles/
│   └── globals.css                      ← Tailwind base + CSS variables
│
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── Dockerfile
└── package.json
```

---

## Infrastructure: `infra/`

```
infra/
├── nginx/
│   ├── nginx.conf                       ← Main config
│   ├── conf.d/
│   │   ├── apple-plus.conf              ← Upstream proxy rules
│   │   └── ssl.conf                     ← SSL/TLS settings
│   └── snippets/
│       └── security-headers.conf
│
├── docker/
│   ├── api.Dockerfile
│   └── web.Dockerfile
│
└── ssl/
    └── certbot/
        └── renewal-hooks/
```

---

## CI/CD: `.github/workflows/`

```
.github/
└── workflows/
    ├── ci.yml                           ← Lint, test, build on every PR
    ├── deploy-staging.yml               ← Deploy to staging on merge to develop
    └── deploy-production.yml            ← Deploy to production on release tag
```

---

## Shared Packages: `packages/`

```
packages/
├── shared-types/
│   ├── src/
│   │   ├── product.types.ts
│   │   ├── order.types.ts
│   │   ├── user.types.ts
│   │   └── index.ts
│   ├── tsconfig.json
│   └── package.json
│
└── ui-kit/
    ├── src/
    │   └── index.ts
    ├── tsconfig.json
    └── package.json
```
