# Apple Plus — REST API Specification

> Swagger-first design. This document is the authoritative source for all API contracts.
> OpenAPI 3.1 YAML lives at `apps/api/src/swagger/openapi.yaml` (generated from decorators at startup).

---

## Table of Contents

1. [Global Conventions](#1-global-conventions)
2. [Authentication Flow](#2-authentication-flow)
3. [Error Format](#3-error-format)
4. [Common DTOs](#4-common-dtos)
5. [Auth Module](#5-auth-module)
6. [Users Module](#6-users-module)
7. [Products Module](#7-products-module)
8. [Categories Module](#8-categories-module)
9. [Variants Module](#9-variants-module)
10. [Inventory Module](#10-inventory-module)
11. [Orders Module](#11-orders-module)
12. [Reviews Module](#12-reviews-module)
13. [Wishlist Module](#13-wishlist-module)
14. [Analytics Module](#14-analytics-module)
15. [Telegram Module](#15-telegram-module)
16. [Authorization Matrix](#16-authorization-matrix)

---

## 1. Global Conventions

### 1.1 Base URL

| Environment | Base URL |
|---|---|
| Local | `http://localhost:3001/api/v1` |
| Staging | `https://api.staging.appleplus.uz/api/v1` |
| Production | `https://api.appleplus.uz/api/v1` |

**API Version prefix:** `/api/v1` on all routes.

### 1.2 Request Conventions

| Rule | Detail |
|---|---|
| Content-Type | `application/json` for all request bodies |
| Accept | `application/json` |
| Date format | ISO 8601 — `2026-06-04T12:00:00.000Z` |
| UUIDs | Standard v4 UUID string, lowercase |
| Decimal values | String-encoded in JSON (`"price": "1299.99"`) to avoid float precision loss |
| Boolean | `true` / `false` (not 0/1) |
| Pagination | Query params: `page` (1-based), `limit` (default 20, max 100) |
| Sorting | `sortBy=createdAt&order=DESC` |
| Filtering | Module-specific query params documented per endpoint |

### 1.3 Response Conventions

All responses are wrapped in a standard envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": { "requestId": "uuid" }
}
```

Paginated responses add a `pagination` key:

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": { "requestId": "uuid" }
}
```

### 1.4 HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK — successful read/update |
| 201 | Created — resource created |
| 204 | No Content — successful delete |
| 400 | Bad Request — validation failed |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — authenticated but lacks permission |
| 404 | Not Found |
| 409 | Conflict — unique constraint violation |
| 422 | Unprocessable Entity — business rule violation |
| 429 | Too Many Requests — rate limit hit |
| 500 | Internal Server Error |

### 1.5 Authentication Header

```
Authorization: Bearer <access_token>
```

### 1.6 Rate Limiting

| Tier | Limit |
|---|---|
| Public endpoints | 60 req/min per IP |
| Authenticated endpoints | 300 req/min per user |
| Auth endpoints (login/register) | 10 req/min per IP |
| Analytics ingestion | 500 req/min per IP |
| Webhook endpoints | No limit (verified by signature) |

Rate limit headers returned on every response:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 297
X-RateLimit-Reset: 1717502400
```

---

## 2. Authentication Flow

### 2.1 Token Architecture

| Token | TTL | Storage | Purpose |
|---|---|---|---|
| Access Token (JWT) | 15 minutes | Memory / HTTP header | Authorizes API calls |
| Refresh Token (opaque) | 7 days | `HttpOnly` cookie OR body | Issues new access tokens |

Access token payload:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "CUSTOMER",
  "iat": 1717500000,
  "exp": 1717500900
}
```

### 2.2 Token Rotation

1. Client sends `POST /auth/refresh` with the refresh token.
2. Server validates: token exists in `refresh_tokens`, `revoked_at IS NULL`, `expires_at > now()`.
3. Server **revokes** the old refresh token (sets `revoked_at = now()`).
4. Server issues a new access token + new refresh token.
5. Client replaces both tokens.

This is a sliding-window, single-use rotation pattern that supports multi-device sessions.

### 2.3 Logout Flow

`POST /auth/logout` accepts the current refresh token and sets `revoked_at` on that specific row, invalidating that device session only.

`POST /auth/logout-all` revokes **all** refresh tokens for the authenticated user (all devices).

---

## 3. Error Format

### 3.1 Validation Error (400)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "must be a valid email address"
      },
      {
        "field": "password",
        "message": "must be at least 8 characters"
      }
    ]
  },
  "meta": { "requestId": "uuid" }
}
```

### 3.2 Business Error (422)

```json
{
  "success": false,
  "error": {
    "code": "COUPON_EXPIRED",
    "message": "This coupon has expired",
    "details": null
  },
  "meta": { "requestId": "uuid" }
}
```

### 3.3 Error Codes Reference

| Code | HTTP | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | DTO validation failed |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `TOKEN_EXPIRED` | 401 | JWT has expired |
| `TOKEN_INVALID` | 401 | JWT is malformed or signature invalid |
| `REFRESH_TOKEN_INVALID` | 401 | Refresh token not found or revoked |
| `EMAIL_NOT_VERIFIED` | 403 | Email verification required |
| `FORBIDDEN` | 403 | Insufficient role/permission |
| `NOT_FOUND` | 404 | Resource not found |
| `SLUG_CONFLICT` | 409 | Slug already in use |
| `EMAIL_CONFLICT` | 409 | Email already registered |
| `REVIEW_EXISTS` | 409 | User already reviewed this product |
| `INSUFFICIENT_STOCK` | 422 | Requested quantity exceeds available stock |
| `COUPON_EXPIRED` | 422 | Coupon expiry date has passed |
| `COUPON_USAGE_LIMIT` | 422 | Global usage limit reached |
| `COUPON_USER_LIMIT` | 422 | Per-user usage limit reached |
| `COUPON_MINIMUM_NOT_MET` | 422 | Order subtotal below coupon minimum |
| `ORDER_NOT_CANCELLABLE` | 422 | Order status does not allow cancellation |
| `INVALID_STATUS_TRANSITION` | 422 | Attempted illegal order status change |
| `CART_EMPTY` | 422 | Cannot checkout with empty cart |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

---

## 4. Common DTOs

### 4.1 PaginationQueryDto

```typescript
class PaginationQueryDto {
  page?: number;         // min: 1, default: 1
  limit?: number;        // min: 1, max: 100, default: 20
  sortBy?: string;       // column name, default varies per endpoint
  order?: 'ASC' | 'DESC'; // default: 'DESC'
}
```

### 4.2 PaginatedResponseDto\<T\>

```typescript
class PaginatedResponseDto<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

### 4.3 MoneyDto

```typescript
// Decimal values serialized as strings in all responses/requests
type MoneyString = string; // e.g. "1299.99"
```

---

## 5. Auth Module

**Base path:** `/auth`

### 5.1 Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a new customer account |
| POST | `/auth/login` | Public | Obtain access + refresh tokens |
| POST | `/auth/logout` | Bearer | Revoke current device session |
| POST | `/auth/logout-all` | Bearer | Revoke all sessions for the user |
| POST | `/auth/refresh` | Refresh token | Issue new token pair |
| POST | `/auth/forgot-password` | Public | Send password reset email |
| POST | `/auth/reset-password` | Public | Complete password reset |
| GET | `/auth/verify-email` | Public | Confirm email address via token |
| GET | `/auth/me` | Bearer | Return current authenticated user |

---

### POST `/auth/register`

**Request DTO:**
```typescript
class RegisterDto {
  firstName: string;    // required, 2–100 chars, letters only
  lastName: string;     // required, 2–100 chars, letters only
  email: string;        // required, valid email, max 255 chars, lowercased
  password: string;     // required, min 8 chars, must contain ≥1 uppercase, ≥1 digit, ≥1 special char
  phone?: string;       // optional, E.164 format (+998901234567)
}
```

**Validation Rules:**
- `email` must not already exist (checked case-insensitively)
- `password` complexity: `/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/`
- `phone` if provided: E.164 format

**Response 201:**
```typescript
class RegisterResponseDto {
  id: string;           // UUID
  email: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER';
  isEmailVerified: false;
  createdAt: string;    // ISO 8601
}
```

**Side Effect:** Sends email verification email. Does not require verification to call other endpoints but some endpoints check `is_email_verified`.

---

### POST `/auth/login`

**Request DTO:**
```typescript
class LoginDto {
  email: string;        // required
  password: string;     // required
}
```

**Validation Rules:**
- Both fields required
- Rate limited: 10 attempts per IP per minute

**Response 200:**
```typescript
class TokenResponseDto {
  accessToken: string;  // JWT, 15-min TTL
  refreshToken: string; // Opaque, 7-day TTL
  expiresIn: number;    // 900 (seconds)
  user: UserSummaryDto;
}

class UserSummaryDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRoleEnum;
  avatarUrl: string | null;
  isEmailVerified: boolean;
}
```

**Error Cases:**
- 401 `INVALID_CREDENTIALS` — wrong email/password
- 401 `EMAIL_NOT_VERIFIED` — if email verification is enforced

---

### POST `/auth/logout`

**Auth:** Bearer token required

**Request DTO:**
```typescript
class LogoutDto {
  refreshToken: string; // required — the token to revoke
}
```

**Response 204:** No content

---

### POST `/auth/logout-all`

**Auth:** Bearer token required

**Request:** No body

**Response 204:** No content

---

### POST `/auth/refresh`

**Request DTO:**
```typescript
class RefreshTokenDto {
  refreshToken: string; // required
}
```

**Validation Rules:**
- Token must exist in `refresh_tokens`, `revoked_at IS NULL`, `expires_at > now()`

**Response 200:** `TokenResponseDto` (same as login response)

**Error Cases:**
- 401 `REFRESH_TOKEN_INVALID`

---

### POST `/auth/forgot-password`

**Request DTO:**
```typescript
class ForgotPasswordDto {
  email: string; // required, valid email
}
```

**Response 200:**
```typescript
{ message: "If this email is registered, a reset link has been sent." }
```

**Note:** Always returns 200 to prevent email enumeration. Token stored hashed in `password_reset_token`, expires in 1 hour via `password_reset_expires_at`.

---

### POST `/auth/reset-password`

**Request DTO:**
```typescript
class ResetPasswordDto {
  token: string;       // required — raw token from email link
  newPassword: string; // required, same complexity rules as register
}
```

**Validation Rules:**
- Token must match `password_reset_token` (hashed comparison), not expired
- New password must differ from current password

**Response 200:**
```typescript
{ message: "Password reset successfully." }
```

**Side Effect:** Revokes all refresh tokens for the user (forces re-login on all devices).

---

### GET `/auth/verify-email?token=<token>`

**Query Params:**
```typescript
{ token: string } // required
```

**Response 200:**
```typescript
{ message: "Email verified successfully." }
```

**Error Cases:**
- 400 `VALIDATION_ERROR` — token missing
- 404 `NOT_FOUND` — token not found or already used

---

### GET `/auth/me`

**Auth:** Bearer token required

**Response 200:**
```typescript
class UserProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRoleEnum;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## 6. Users Module

**Base path:** `/users`

### 6.1 Endpoints

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/users` | Bearer | ADMIN, SUPER_ADMIN | List all users (paginated) |
| GET | `/users/me` | Bearer | Any | Get own profile |
| PATCH | `/users/me` | Bearer | Any | Update own profile |
| DELETE | `/users/me` | Bearer | Any | Soft-delete own account |
| POST | `/users/me/avatar` | Bearer | Any | Upload avatar |
| GET | `/users/:id` | Bearer | ADMIN, SUPER_ADMIN | Get any user by ID |
| PATCH | `/users/:id` | Bearer | ADMIN, SUPER_ADMIN | Update any user |
| PATCH | `/users/:id/role` | Bearer | SUPER_ADMIN | Change user role |
| DELETE | `/users/:id` | Bearer | SUPER_ADMIN | Soft-delete any user |
| GET | `/users/me/addresses` | Bearer | Any | List own addresses |
| POST | `/users/me/addresses` | Bearer | Any | Add address |
| PATCH | `/users/me/addresses/:addressId` | Bearer | Any | Update address |
| DELETE | `/users/me/addresses/:addressId` | Bearer | Any | Delete address |
| POST | `/users/me/addresses/:addressId/default` | Bearer | Any | Set default address |

---

### GET `/users`

**Auth:** ADMIN, SUPER_ADMIN

**Query Params:**
```typescript
class UsersFilterDto extends PaginationQueryDto {
  search?: string;       // searches email, firstName, lastName
  role?: UserRoleEnum;
  isEmailVerified?: boolean;
  isDeleted?: boolean;   // default: false (SUPER_ADMIN only)
  sortBy?: 'createdAt' | 'email' | 'lastName'; // default: 'createdAt'
}
```

**Response 200:** `PaginatedResponseDto<UserListItemDto>`

```typescript
class UserListItemDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRoleEnum;
  isEmailVerified: boolean;
  avatarUrl: string | null;
  createdAt: string;
  deletedAt: string | null;
}
```

---

### PATCH `/users/me`

**Request DTO:**
```typescript
class UpdateProfileDto {
  firstName?: string;   // 2–100 chars
  lastName?: string;    // 2–100 chars
  phone?: string;       // E.164 or null to remove
}
```

**Validation Rules:**
- At least one field required
- Cannot change email or role via this endpoint

**Response 200:** `UserProfileDto`

---

### PATCH `/users/:id/role`

**Auth:** SUPER_ADMIN only

**Request DTO:**
```typescript
class ChangeRoleDto {
  role: UserRoleEnum; // required; all enum values allowed
}
```

**Validation Rules:**
- Cannot demote the last SUPER_ADMIN
- `role_id` on the user record updated in the same transaction as `role` enum field

**Response 200:** `UserListItemDto`

---

### POST `/users/me/avatar`

**Auth:** Any authenticated user

**Request:** `multipart/form-data`
```
field: file (image/jpeg, image/png, image/webp; max 5 MB)
```

**Validation Rules:**
- MIME type must be one of: `image/jpeg`, `image/png`, `image/webp`
- Max file size: 5 MB
- Dimensions: min 100×100 px, max 4096×4096 px

**Response 200:**
```typescript
{ avatarUrl: string } // CDN URL of uploaded image
```

---

### POST `/users/me/addresses`

**Request DTO:**
```typescript
class CreateAddressDto {
  label?: string;           // max 50 chars, e.g. "Home"
  recipientName: string;    // required, max 200 chars
  phone: string;            // required, E.164
  addressLine1: string;     // required, max 255 chars
  addressLine2?: string;    // max 255 chars
  city: string;             // required, max 100 chars
  state: string;            // required, max 100 chars
  postalCode: string;       // required, max 20 chars
  country: string;          // required, ISO 3166-1 alpha-2, uppercase (e.g. "UZ")
  isDefault?: boolean;      // default: false; if true, clears isDefault on other addresses
}
```

**Validation Rules:**
- `country` must be valid ISO 3166-1 alpha-2 code
- `phone` must match E.164 format
- Max 10 addresses per user

**Response 201:** `AddressDto`

```typescript
class AddressDto {
  id: string;
  label: string | null;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## 7. Products Module

**Base path:** `/products`

### 7.1 Endpoints

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/products` | Public | — | List products (paginated, filterable) |
| GET | `/products/:slug` | Public | — | Get product detail by slug |
| GET | `/products/:id/related` | Public | — | Related products (same category/brand) |
| POST | `/products` | Bearer | ADMIN, SUPER_ADMIN | Create product |
| PATCH | `/products/:id` | Bearer | ADMIN, SUPER_ADMIN | Update product |
| PATCH | `/products/:id/status` | Bearer | ADMIN, SUPER_ADMIN | Change product status |
| DELETE | `/products/:id` | Bearer | ADMIN, SUPER_ADMIN | Soft-delete product |
| POST | `/products/:id/images` | Bearer | ADMIN, SUPER_ADMIN | Upload product image |
| DELETE | `/products/:id/images/:imageId` | Bearer | ADMIN, SUPER_ADMIN | Remove image |
| PATCH | `/products/:id/images/reorder` | Bearer | ADMIN, SUPER_ADMIN | Update image sort order |

---

### GET `/products`

**Auth:** Public

**Query Params:**
```typescript
class ProductFilterDto extends PaginationQueryDto {
  search?: string;           // full-text search on name, description
  categoryId?: string;       // UUID; includes sub-categories
  categorySlug?: string;     // alternative to categoryId
  brandId?: string;          // UUID
  brandSlug?: string;        // alternative to brandId
  status?: ProductStatusEnum; // default: ACTIVE (public); ADMIN can query DRAFT/ARCHIVED
  minPrice?: string;         // MoneyString
  maxPrice?: string;         // MoneyString
  tags?: string[];           // any match (array contains)
  inStock?: boolean;         // available_quantity > 0
  minRating?: number;        // 1–5
  attributes?: string;       // JSON-encoded: {"color":"Black","storage":"256GB"}
  sortBy?: 'price' | 'rating' | 'createdAt' | 'reviewCount'; // default: 'createdAt'
  order?: 'ASC' | 'DESC';    // default: 'DESC'
}
```

**Validation Rules:**
- Non-admin callers: `status` forced to `ACTIVE`
- `minPrice` / `maxPrice` must be valid decimals > 0
- `attributes` is JSON-decoded and validated against JSONB GIN index

**Response 200:** `PaginatedResponseDto<ProductListItemDto>`

```typescript
class ProductListItemDto {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  basePrice: string;          // MoneyString
  salePrice: string | null;   // MoneyString
  effectivePrice: string;     // salePrice ?? basePrice
  status: ProductStatusEnum;
  averageRating: string;      // "4.25"
  reviewCount: number;
  tags: string[];
  category: CategorySummaryDto;
  brand: BrandSummaryDto;
  primaryImage: ProductImageDto | null;
  defaultVariant: VariantSummaryDto | null;
  createdAt: string;
}
```

---

### GET `/products/:slug`

**Auth:** Public (draft/archived visible only to ADMIN)

**Path Params:**
- `slug`: URL slug string

**Response 200:** `ProductDetailDto`

```typescript
class ProductDetailDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  basePrice: string;
  salePrice: string | null;
  status: ProductStatusEnum;
  averageRating: string;
  reviewCount: number;
  tags: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  category: CategorySummaryDto;
  brand: BrandSummaryDto;
  images: ProductImageDto[];
  variants: VariantDetailDto[];
  createdAt: string;
  updatedAt: string;
}
```

---

### POST `/products`

**Auth:** ADMIN, SUPER_ADMIN

**Request DTO:**
```typescript
class CreateProductDto {
  name: string;              // required, max 300 chars
  slug?: string;             // auto-generated from name if omitted; max 350 chars, kebab-case
  description?: string;      // max 10000 chars
  shortDescription?: string; // max 500 chars
  categoryId: string;        // required, UUID, must reference active category
  brandId: string;           // required, UUID, must reference active brand
  basePrice: string;         // required, MoneyString > 0
  salePrice?: string;        // MoneyString > 0, must be < basePrice
  status?: ProductStatusEnum; // default: DRAFT
  tags?: string[];           // max 20 tags, each max 50 chars
  metaTitle?: string;        // max 160 chars
  metaDescription?: string;  // max 320 chars
}
```

**Validation Rules:**
- `slug` must be unique among active products (case-insensitive)
- `salePrice`, if set, must be strictly less than `basePrice`
- `categoryId` must reference a non-deleted, active category
- `brandId` must reference an active brand

**Response 201:** `ProductDetailDto` (without variants/images — add separately)

---

### PATCH `/products/:id/status`

**Auth:** ADMIN, SUPER_ADMIN

**Request DTO:**
```typescript
class ChangeProductStatusDto {
  status: ProductStatusEnum; // required: DRAFT | ACTIVE | ARCHIVED
}
```

**Validation Rules:**
- `DRAFT → ACTIVE`: product must have at least one active variant with inventory record
- `ARCHIVED`: allowed at any time; hides product from public catalog
- `ARCHIVED → ACTIVE`: same requirements as DRAFT → ACTIVE

**Response 200:** `ProductDetailDto`

---

### POST `/products/:id/images`

**Auth:** ADMIN, SUPER_ADMIN

**Request:** `multipart/form-data`
```
field: file   (image/jpeg, image/png, image/webp; max 10 MB)
field: variantId   (optional UUID — associates image with a specific variant)
field: altText     (optional string, max 255 chars)
field: isPrimary   (optional boolean; if true, clears isPrimary on other images for this product)
```

**Response 201:** `ProductImageDto`

```typescript
class ProductImageDto {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  variantId: string | null;
}
```

---

### PATCH `/products/:id/images/reorder`

**Auth:** ADMIN, SUPER_ADMIN

**Request DTO:**
```typescript
class ReorderImagesDto {
  images: Array<{
    id: string;        // image UUID
    sortOrder: number; // new sort order (0-based)
  }>;
}
```

**Validation Rules:**
- All provided image IDs must belong to this product
- `sortOrder` values must be unique within the request

**Response 200:** `ProductImageDto[]`

---

## 8. Categories Module

**Base path:** `/categories`

### 8.1 Endpoints

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/categories` | Public | — | Get category tree (nested) |
| GET | `/categories/flat` | Public | — | Get flat list (paginated) |
| GET | `/categories/:slug` | Public | — | Get category with children |
| POST | `/categories` | Bearer | ADMIN, SUPER_ADMIN | Create category |
| PATCH | `/categories/:id` | Bearer | ADMIN, SUPER_ADMIN | Update category |
| DELETE | `/categories/:id` | Bearer | ADMIN, SUPER_ADMIN | Deactivate category |

---

### GET `/categories`

**Auth:** Public (inactive categories hidden from public; visible to ADMIN)

**Query Params:**
```typescript
{
  includeInactive?: boolean; // ADMIN only, default: false
}
```

**Response 200:**
```typescript
class CategoryTreeDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;    // COUNT of active, non-deleted products
  children: CategoryTreeDto[];
}
```

Returns root categories with `children` nested recursively. Max depth: 5 levels.

---

### POST `/categories`

**Auth:** ADMIN, SUPER_ADMIN

**Request DTO:**
```typescript
class CreateCategoryDto {
  name: string;             // required, max 150 chars
  slug?: string;            // auto-generated if omitted; max 200 chars
  parentId?: string;        // UUID — null for root category
  description?: string;     // max 2000 chars
  imageUrl?: string;        // URL, max 500 chars
  metaTitle?: string;       // max 160 chars
  metaDescription?: string; // max 320 chars
  sortOrder?: number;       // default: 0; integer >= 0
  isActive?: boolean;       // default: true
}
```

**Validation Rules:**
- `slug` must be globally unique
- `parentId`, if provided, must reference an existing active category
- Circular parent references are rejected

**Response 201:** `CategoryDetailDto`

```typescript
class CategoryDetailDto {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  sortOrder: number;
  isActive: boolean;
  parent: CategorySummaryDto | null;
  children: CategorySummaryDto[];
  createdAt: string;
  updatedAt: string;
}
```

---

### DELETE `/categories/:id`

**Auth:** ADMIN, SUPER_ADMIN

**Response 204:** No content

**Error Cases:**
- 422 `CATEGORY_HAS_PRODUCTS` — cannot deactivate a category that has active products (frontend must reassign products first)

---

## 9. Variants Module

**Base path:** `/products/:productId/variants` and `/variants`

### 9.1 Endpoints

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/products/:productId/variants` | Public | — | List all variants for a product |
| GET | `/variants/:id` | Public | — | Get single variant detail |
| POST | `/products/:productId/variants` | Bearer | ADMIN, SUPER_ADMIN | Create variant |
| PATCH | `/variants/:id` | Bearer | ADMIN, SUPER_ADMIN | Update variant |
| DELETE | `/variants/:id` | Bearer | ADMIN, SUPER_ADMIN | Deactivate variant |
| PATCH | `/variants/:id/default` | Bearer | ADMIN, SUPER_ADMIN | Set as default variant |

---

### GET `/products/:productId/variants`

**Auth:** Public (inactive variants hidden from public)

**Query Params:**
```typescript
{
  includeInactive?: boolean; // ADMIN only
  attributes?: string;       // JSON filter: {"color":"Black"}
}
```

**Response 200:** `VariantDetailDto[]`

```typescript
class VariantDetailDto {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: string;
  salePrice: string | null;
  effectivePrice: string;
  attributes: Record<string, string>; // {"color":"Black","storage":"256GB"}
  weightKg: string | null;
  isDefault: boolean;
  isActive: boolean;
  inventory: InventorySummaryDto | null;
  images: ProductImageDto[];
  createdAt: string;
  updatedAt: string;
}

class InventorySummaryDto {
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;   // computed: quantity - reservedQuantity
  reorderLevel: number;
  inStock: boolean;            // availableQuantity > 0
}
```

---

### POST `/products/:productId/variants`

**Auth:** ADMIN, SUPER_ADMIN

**Request DTO:**
```typescript
class CreateVariantDto {
  sku: string;               // required, max 100 chars; format: APL-BRAND-MODEL-ATTR
  name: string;              // required, max 200 chars
  price: string;             // required, MoneyString > 0
  salePrice?: string;        // MoneyString > 0, must be < price
  attributes: Record<string, string>; // required, e.g. {"color":"Black","storage":"256GB"}
  weightKg?: string;         // decimal string > 0
  isDefault?: boolean;       // default: false; if true, clears isDefault on sibling variants
  isActive?: boolean;        // default: true
  initialQuantity?: number;  // integer >= 0; creates inventory_item record
  reorderLevel?: number;     // default: 5; integer >= 0
  warehouseLocation?: string; // max 100 chars
}
```

**Validation Rules:**
- `sku` must be globally unique (case-insensitive match)
- `salePrice` < `price` if provided
- `attributes` keys and values must be non-empty strings
- `initialQuantity`, if provided, creates an `inventory_items` row atomically

**Response 201:** `VariantDetailDto`

---

## 10. Inventory Module

**Base path:** `/inventory`

### 10.1 Endpoints

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/inventory` | Bearer | ADMIN, SUPER_ADMIN | List all inventory items |
| GET | `/inventory/:variantId` | Bearer | ADMIN, SUPER_ADMIN | Get inventory for variant |
| PATCH | `/inventory/:variantId` | Bearer | ADMIN, SUPER_ADMIN | Update inventory settings |
| POST | `/inventory/:variantId/adjust` | Bearer | ADMIN, SUPER_ADMIN | Adjust stock quantity |
| GET | `/inventory/low-stock` | Bearer | ADMIN, SUPER_ADMIN | Items at or below reorder level |
| GET | `/inventory/out-of-stock` | Bearer | ADMIN, SUPER_ADMIN | Items with zero available quantity |

---

### GET `/inventory`

**Auth:** ADMIN, SUPER_ADMIN

**Query Params:**
```typescript
class InventoryFilterDto extends PaginationQueryDto {
  search?: string;           // searches variant SKU, product name
  categoryId?: string;
  brandId?: string;
  lowStock?: boolean;        // quantity <= reorderLevel
  outOfStock?: boolean;      // availableQuantity == 0
  sortBy?: 'quantity' | 'sku' | 'updatedAt'; // default: 'updatedAt'
}
```

**Response 200:** `PaginatedResponseDto<InventoryItemDto>`

```typescript
class InventoryItemDto {
  id: string;
  variantId: string;
  sku: string;
  variantName: string;
  productId: string;
  productName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  warehouseLocation: string | null;
  updatedAt: string;
}
```

---

### POST `/inventory/:variantId/adjust`

**Auth:** ADMIN, SUPER_ADMIN

**Request DTO:**
```typescript
class AdjustStockDto {
  adjustment: number;   // required; positive = add stock, negative = remove
  reason: string;       // required, max 500 chars (e.g. "Received PO #1234")
}
```

**Validation Rules:**
- `quantity + adjustment` must result in value >= `reserved_quantity` (cannot go below reserved)
- Row-level lock (SELECT FOR UPDATE) applied before adjustment

**Response 200:** `InventoryItemDto`

---

### PATCH `/inventory/:variantId`

**Auth:** ADMIN, SUPER_ADMIN

**Request DTO:**
```typescript
class UpdateInventoryDto {
  reorderLevel?: number;         // integer >= 0
  warehouseLocation?: string;    // max 100 chars; null to clear
}
```

**Response 200:** `InventoryItemDto`

---

## 11. Orders Module

**Base path:** `/orders` and `/cart`

### 11.1 Cart Endpoints

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/cart` | Bearer / Guest | — | Get current cart |
| POST | `/cart/items` | Bearer / Guest | — | Add item to cart |
| PATCH | `/cart/items/:itemId` | Bearer / Guest | — | Update item quantity |
| DELETE | `/cart/items/:itemId` | Bearer / Guest | — | Remove item from cart |
| DELETE | `/cart` | Bearer / Guest | — | Clear cart |
| POST | `/cart/coupon` | Bearer | — | Apply coupon |
| DELETE | `/cart/coupon` | Bearer | — | Remove coupon |
| GET | `/cart/summary` | Bearer / Guest | — | Get cart totals with shipping estimate |

### 11.2 Checkout & Orders Endpoints

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/orders` | Bearer | CUSTOMER+ | Create order from cart (checkout) |
| GET | `/orders` | Bearer | CUSTOMER+ | List own orders (ADMIN sees all) |
| GET | `/orders/:id` | Bearer | Owner / ADMIN | Get order detail |
| POST | `/orders/:id/cancel` | Bearer | Owner / ADMIN | Cancel an order |
| PATCH | `/orders/:id/status` | Bearer | ADMIN, SUPER_ADMIN | Admin status update |
| GET | `/orders/:id/tracking` | Bearer | Owner / ADMIN | Get shipment tracking |

### 11.3 Payment Endpoints

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/payments/intent` | Bearer | Any | Create Stripe PaymentIntent |
| POST | `/payments/webhook` | Public (HMAC) | — | Stripe webhook receiver |
| GET | `/orders/:id/payment` | Bearer | Owner / ADMIN | Get payment record |

---

### GET `/cart`

**Auth:** Bearer (authenticated user) or guest via `X-Session-Id` header

**Response 200:** `CartDto`

```typescript
class CartDto {
  id: string;
  items: CartItemDto[];
  coupon: CouponSummaryDto | null;
  subtotal: string;
  discountAmount: string;
  shippingEstimate: string;
  taxEstimate: string;
  total: string;
  itemCount: number;
}

class CartItemDto {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  attributes: Record<string, string>;
  quantity: number;
  unitPrice: string;        // current live price (may differ from priceSnapshot)
  priceSnapshot: string;    // price at time of add
  priceChanged: boolean;    // unitPrice !== priceSnapshot
  total: string;
  imageUrl: string | null;
  availableQuantity: number;
  inStock: boolean;
}
```

---

### POST `/cart/items`

**Auth:** Bearer or Guest (`X-Session-Id`)

**Request DTO:**
```typescript
class AddToCartDto {
  variantId: string;  // required, UUID
  quantity: number;   // required, integer >= 1
}
```

**Validation Rules:**
- `variantId` must reference an active variant with `is_active = true` and product `status = ACTIVE`
- `quantity` must be <= `available_quantity` from inventory
- If the variant is already in cart, quantities are summed (not duplicated)
- Max 50 distinct items per cart

**Response 200:** `CartDto`

---

### POST `/cart/coupon`

**Auth:** Bearer

**Request DTO:**
```typescript
class ApplyCouponDto {
  code: string; // required, normalized to UPPERCASE
}
```

**Validation Rules:**
- Coupon must exist, `is_active = true`
- `starts_at <= now() <= expires_at` (if set)
- `usage_count < usage_limit` (if set)
- Per-user usage: count of orders with this coupon < `per_user_limit`
- Cart subtotal >= `minimum_order_amount` (if set)

**Response 200:** `CartDto` with `coupon` populated

**Error Codes:** `COUPON_EXPIRED`, `COUPON_USAGE_LIMIT`, `COUPON_USER_LIMIT`, `COUPON_MINIMUM_NOT_MET`

---

### POST `/orders`

**Auth:** Bearer, CUSTOMER or above

**Request DTO:**
```typescript
class CreateOrderDto {
  shippingAddressId: string;  // required, UUID — must belong to current user
  billingAddressId?: string;  // defaults to shippingAddressId
  shippingProvider: string;   // required: 'fedex' | 'ups' | 'dhl'
  notes?: string;             // max 1000 chars
}
```

**Process (atomic transaction):**
1. Validate cart is non-empty
2. For each cart item: lock inventory row, check `available_quantity >= quantity`
3. Reserve inventory: `reserved_quantity += quantity`
4. Snapshot product/variant data into `order_items`
5. Snapshot addresses into `orders.shipping_address_snapshot` / `billing_address_snapshot`
6. Apply coupon discount (if cart has coupon): increment `coupon.usage_count`
7. Create `orders` row with `status = PENDING`
8. Create `shipments` row with `status = PREPARING`
9. Clear cart items

**Validation Rules:**
- Cart must not be empty (`CART_EMPTY`)
- All items must still be in stock (`INSUFFICIENT_STOCK`)
- Address IDs must belong to authenticated user

**Response 201:** `OrderDetailDto`

```typescript
class OrderDetailDto {
  id: string;
  orderNumber: string;        // APL-YYYYMMDD-NNNNN
  status: OrderStatusEnum;
  items: OrderItemDto[];
  subtotal: string;
  discountAmount: string;
  shippingAmount: string;
  taxAmount: string;
  total: string;
  currency: string;
  couponCode: string | null;
  shippingAddress: AddressSnapshotDto;
  billingAddress: AddressSnapshotDto;
  notes: string | null;
  payment: PaymentDto | null;
  shipment: ShipmentDto | null;
  createdAt: string;
  updatedAt: string;
}

class OrderItemDto {
  id: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  attributes: Record<string, string>;
  quantity: number;
  unitPrice: string;
  discountAmount: string;
  total: string;
  imageUrl: string | null;
}
```

---

### GET `/orders`

**Auth:** Bearer

**Query Params:**
```typescript
class OrdersFilterDto extends PaginationQueryDto {
  status?: OrderStatusEnum;
  userId?: string;        // ADMIN only — filter by user; default: own orders
  search?: string;        // searches orderNumber (ADMIN)
  dateFrom?: string;      // ISO 8601 date
  dateTo?: string;        // ISO 8601 date
  sortBy?: 'createdAt' | 'total' | 'status'; // default: 'createdAt'
}
```

**Response 200:** `PaginatedResponseDto<OrderListItemDto>`

```typescript
class OrderListItemDto {
  id: string;
  orderNumber: string;
  status: OrderStatusEnum;
  itemCount: number;
  total: string;
  currency: string;
  paymentStatus: PaymentStatusEnum | null;
  shipmentStatus: ShipmentStatusEnum | null;
  createdAt: string;
}
```

---

### POST `/orders/:id/cancel`

**Auth:** Bearer — owner (status must be `PENDING` or `CONFIRMED`) or ADMIN (can cancel up to `PROCESSING`)

**Request DTO:**
```typescript
class CancelOrderDto {
  reason?: string; // max 500 chars
}
```

**Process (atomic):**
1. Validate cancellable status
2. Release inventory: `reserved_quantity -= quantity` for each order item
3. Set `orders.status = CANCELLED`
4. If payment was `PAID`: create refund request (triggers refund flow)

**Response 200:** `OrderDetailDto`

**Error:** `ORDER_NOT_CANCELLABLE` (422)

---

### PATCH `/orders/:id/status`

**Auth:** ADMIN, SUPER_ADMIN

**Request DTO:**
```typescript
class UpdateOrderStatusDto {
  status: OrderStatusEnum; // required
  note?: string;           // max 500 chars — admin note
}
```

**State Machine:**
```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
PENDING → CANCELLED
CONFIRMED → CANCELLED
DELIVERED → REFUNDED (requires payment refund)
```

**Validation Rules:**
- Only listed transitions are allowed; others return `INVALID_STATUS_TRANSITION`
- `SHIPPED` transition: `tracking_number` must be set on shipment first

**Response 200:** `OrderDetailDto`

---

### POST `/payments/intent`

**Auth:** Bearer

**Request DTO:**
```typescript
class CreatePaymentIntentDto {
  orderId: string; // required, UUID — order must be in CONFIRMED or PROCESSING status
}
```

**Response 200:**
```typescript
class PaymentIntentDto {
  clientSecret: string;   // Stripe PaymentIntent client_secret for frontend SDK
  paymentId: string;      // internal UUID
  amount: string;         // MoneyString
  currency: string;
}
```

---

### POST `/payments/webhook`

**Auth:** Public — signature verified via `Stripe-Signature` header + `STRIPE_WEBHOOK_SECRET`

**Request:** Raw Stripe event body (do not parse before signature verification)

**Handled Events:**
- `payment_intent.succeeded` → set payment status to `PAID`, order to `CONFIRMED`
- `payment_intent.payment_failed` → set payment status to `FAILED`
- `charge.refunded` → set payment status to `REFUNDED` or `PARTIALLY_REFUNDED`

**Response 200:**
```typescript
{ received: true }
```

---

## 12. Reviews Module

**Base path:** `/reviews` and `/products/:productId/reviews`

### 12.1 Endpoints

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/products/:productId/reviews` | Public | — | List approved reviews for product |
| POST | `/products/:productId/reviews` | Bearer | CUSTOMER | Submit a review |
| PATCH | `/reviews/:id` | Bearer | Owner | Edit own review |
| DELETE | `/reviews/:id` | Bearer | Owner / MODERATOR+ | Delete review |
| GET | `/reviews/pending` | Bearer | MODERATOR, ADMIN+ | Moderation queue |
| PATCH | `/reviews/:id/moderate` | Bearer | MODERATOR, ADMIN+ | Approve or reject |

---

### GET `/products/:productId/reviews`

**Auth:** Public

**Query Params:**
```typescript
class ReviewsFilterDto extends PaginationQueryDto {
  rating?: number;           // 1–5 filter
  verifiedOnly?: boolean;    // only verified purchases
  sortBy?: 'createdAt' | 'rating' | 'helpful'; // default: 'createdAt'
  order?: 'ASC' | 'DESC';   // default: 'DESC'
}
```

**Response 200:** `PaginatedResponseDto<ReviewDto>` plus rating summary

```typescript
class ReviewListResponseDto {
  reviews: ReviewDto[];
  pagination: PaginationDto;
  summary: ReviewSummaryDto;
}

class ReviewSummaryDto {
  averageRating: string;       // "4.25"
  totalCount: number;
  distribution: {
    5: number; 4: number; 3: number; 2: number; 1: number;
  };
}

class ReviewDto {
  id: string;
  rating: number;              // 1–5
  title: string | null;
  body: string | null;
  isVerifiedPurchase: boolean;
  author: {
    firstName: string;
    avatarUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
}
```

---

### POST `/products/:productId/reviews`

**Auth:** Bearer, CUSTOMER or above

**Request DTO:**
```typescript
class CreateReviewDto {
  rating: number;   // required, integer 1–5
  title?: string;   // max 200 chars
  body?: string;    // max 5000 chars
}
```

**Validation Rules:**
- User must not have an existing review for this product (UNIQUE constraint) → `REVIEW_EXISTS`
- `rating` must be integer between 1 and 5
- `isVerifiedPurchase` set automatically: check if user has a `DELIVERED` order containing this product
- Review starts in `PENDING` status; visible only after moderation approval

**Response 201:** `ReviewDto` (with `status: 'PENDING'` for the author, hidden from others)

---

### PATCH `/reviews/:id/moderate`

**Auth:** MODERATOR, ADMIN, SUPER_ADMIN

**Request DTO:**
```typescript
class ModerateReviewDto {
  status: 'APPROVED' | 'REJECTED'; // required
  moderationNote?: string;          // max 1000 chars; internal only, not exposed to reviewer
}
```

**Side Effects on APPROVED:**
- Triggers update of `products.average_rating` and `products.review_count` (via event or direct update in same transaction)

**Response 200:** Full review with `status` field visible

---

## 13. Wishlist Module

**Base path:** `/wishlist`

### 13.1 Endpoints

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/wishlist` | Bearer | Any | Get own wishlist |
| POST | `/wishlist/items` | Bearer | Any | Add variant to wishlist |
| DELETE | `/wishlist/items/:variantId` | Bearer | Any | Remove from wishlist |
| GET | `/wishlist/check/:variantId` | Bearer | Any | Check if variant is wishlisted |

---

### GET `/wishlist`

**Auth:** Bearer

**Query Params:** `PaginationQueryDto` (default limit: 20)

**Response 200:** `PaginatedResponseDto<WishlistItemDto>`

```typescript
class WishlistItemDto {
  id: string;
  variantId: string;
  sku: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  attributes: Record<string, string>;
  price: string;
  salePrice: string | null;
  effectivePrice: string;
  imageUrl: string | null;
  inStock: boolean;
  availableQuantity: number;
  addedAt: string;        // wishlist_items.created_at
}
```

---

### POST `/wishlist/items`

**Auth:** Bearer

**Request DTO:**
```typescript
class AddToWishlistDto {
  variantId: string; // required, UUID
}
```

**Validation Rules:**
- `variantId` must reference an existing, active variant
- UNIQUE (user_id, variant_id) — silently upserts if already present (no error)

**Response 201:** `WishlistItemDto`

---

### GET `/wishlist/check/:variantId`

**Auth:** Bearer

**Response 200:**
```typescript
{ isWishlisted: boolean }
```

---

## 14. Analytics Module

**Base path:** `/analytics`

### 14.1 Endpoints

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/analytics/events` | Public / Bearer | — | Ingest a client-side event |
| GET | `/analytics/dashboard` | Bearer | ADMIN, SUPER_ADMIN | Overview KPIs |
| GET | `/analytics/products/stats` | Bearer | ADMIN, SUPER_ADMIN | Product performance stats |
| GET | `/analytics/orders/stats` | Bearer | ADMIN, SUPER_ADMIN | Sales / revenue stats |
| GET | `/analytics/users/stats` | Bearer | ADMIN, SUPER_ADMIN | User acquisition stats |
| GET | `/analytics/search/stats` | Bearer | ADMIN, SUPER_ADMIN | Search query stats |

---

### POST `/analytics/events`

**Auth:** Public (no token required); authenticated users have `user_id` extracted from JWT if present

**Request DTO:**
```typescript
class TrackEventDto {
  eventType: AnalyticsEventTypeEnum; // required
  sessionId: string;                 // required, client-generated UUID per browser session
  productId?: string;                // UUID, for product events
  orderId?: string;                  // UUID, for order events
  categoryId?: string;               // UUID
  metadata?: Record<string, unknown>; // event-specific payload, max 4KB JSON
  referrer?: string;                 // max 2000 chars
}
```

**AnalyticsEventTypeEnum values:**
- `page.viewed`, `product.viewed`, `product.added_to_cart`
- `product.removed_from_cart`, `search.performed`
- `order.initiated`, `order.completed`, `coupon.applied`
- `user.registered`, `user.logged_in`, `wishlist.added`, `wishlist.removed`
- `review.submitted`

**Validation Rules:**
- `metadata` must be JSON-serializable, max 4 KB
- `sessionId` must be a valid UUID v4
- No FK validation on IDs — soft references only (per DB design)

**Response 202:** `{ queued: true }` (fire-and-forget; no synchronous DB write guarantee)

---

### GET `/analytics/dashboard`

**Auth:** ADMIN, SUPER_ADMIN

**Query Params:**
```typescript
{
  period: 'today' | '7d' | '30d' | '90d' | 'custom';
  dateFrom?: string;  // ISO date, required when period = 'custom'
  dateTo?: string;    // ISO date, required when period = 'custom'
}
```

**Response 200:**
```typescript
class DashboardDto {
  period: { from: string; to: string };
  revenue: {
    total: string;
    change: string;      // percentage vs previous period
    trend: TrendPointDto[];
  };
  orders: {
    total: number;
    change: string;
    byStatus: Record<OrderStatusEnum, number>;
  };
  users: {
    newRegistrations: number;
    change: string;
  };
  products: {
    topViewed: ProductStatDto[];
    topSelling: ProductStatDto[];
    lowStock: number;
    outOfStock: number;
  };
  conversionRate: string;   // percentage: orders / unique sessions
}

class TrendPointDto {
  date: string;   // ISO date
  value: string;  // revenue amount
}

class ProductStatDto {
  productId: string;
  productName: string;
  value: number;   // views or units sold
}
```

---

### GET `/analytics/products/stats`

**Auth:** ADMIN, SUPER_ADMIN

**Query Params:**
```typescript
{
  dateFrom: string;    // required, ISO date
  dateTo: string;      // required, ISO date
  productId?: string;  // filter to single product
  categoryId?: string;
  sortBy?: 'views' | 'addToCart' | 'uniqueVisitors'; // default: 'views'
  limit?: number;      // default: 20, max: 100
}
```

**Response 200:** `ProductStatsDto[]`

```typescript
class ProductStatsDto {
  productId: string;
  productName: string;
  views: number;
  addToCartEvents: number;
  uniqueVisitors: number;
  addToCartRate: string;   // addToCartEvents / views as percentage
  period: { from: string; to: string };
}
```

---

## 15. Telegram Module

**Base path:** `/telegram`

### 15.1 Endpoints

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/telegram/webhook` | Public (secret token) | — | Telegram Bot webhook receiver |
| GET | `/telegram/status` | Bearer | SUPER_ADMIN | Bot connection status |
| POST | `/telegram/notify` | Bearer | ADMIN, SUPER_ADMIN | Send manual notification |

---

### POST `/telegram/webhook`

**Auth:** Verified via `X-Telegram-Bot-Api-Secret-Token` header (set in BotFather webhook config)

**Request:** Telegram `Update` object (passthrough from Telegram servers)

**Handled Update Types:**
- `/start` command → welcome message
- `/orders <order_number>` → order status lookup for linked user
- `/help` → command list

**Response 200:**
```typescript
{ ok: true }
```

**Note:** Always responds 200 to Telegram even on handled errors — failure causes Telegram to retry.

---

### GET `/telegram/status`

**Auth:** SUPER_ADMIN

**Response 200:**
```typescript
class TelegramStatusDto {
  botUsername: string;
  isConnected: boolean;
  webhookUrl: string;
  pendingUpdateCount: number;
  lastErrorMessage: string | null;
  lastErrorDate: string | null;
}
```

---

### POST `/telegram/notify`

**Auth:** ADMIN, SUPER_ADMIN

**Request DTO:**
```typescript
class SendTelegramNotificationDto {
  chatId: string;        // required — Telegram chat ID or @username
  message: string;       // required, max 4096 chars (Telegram limit)
  parseMode?: 'HTML' | 'MarkdownV2'; // default: 'HTML'
  silent?: boolean;      // default: false
}
```

**Response 200:**
```typescript
{ sent: boolean; messageId: number }
```

---

## 16. Authorization Matrix

### 16.1 Role Definitions

| Role | Description |
|---|---|
| `SUPER_ADMIN` | Full access including system config, role management, hard deletes |
| `ADMIN` | Full catalog and order management; cannot change roles or system config |
| `MODERATOR` | Can moderate reviews; read-only access to orders and users |
| `SELLER` | Can create/manage own products; cannot manage other sellers' products |
| `CUSTOMER` | Standard shopper; can place orders, write reviews, manage own profile |
| `GUEST` | Unauthenticated; read-only catalog access; cannot place orders |

### 16.2 Permission Matrix

| Endpoint | GUEST | CUSTOMER | MODERATOR | SELLER | ADMIN | SUPER_ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| GET /products | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| GET /products/:slug | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| POST /products | — | — | — | own | ✓ | ✓ |
| PATCH /products/:id | — | — | — | own | ✓ | ✓ |
| DELETE /products/:id | — | — | — | — | ✓ | ✓ |
| GET /categories | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| POST /categories | — | — | — | — | ✓ | ✓ |
| PATCH /categories/:id | — | — | — | — | ✓ | ✓ |
| GET /inventory | — | — | — | own | ✓ | ✓ |
| PATCH /inventory/:id | — | — | — | — | ✓ | ✓ |
| POST /inventory/:id/adjust | — | — | — | — | ✓ | ✓ |
| GET /cart | guest | ✓ | ✓ | ✓ | ✓ | ✓ |
| POST /orders | — | ✓ | — | — | ✓ | ✓ |
| GET /orders (own) | — | ✓ | — | — | ✓ | ✓ |
| GET /orders (all) | — | — | — | — | ✓ | ✓ |
| PATCH /orders/:id/status | — | — | — | — | ✓ | ✓ |
| POST /orders/:id/cancel (own) | — | ✓ | — | — | ✓ | ✓ |
| POST /reviews | — | ✓ | — | ✓ | ✓ | ✓ |
| PATCH /reviews/:id/moderate | — | — | ✓ | — | ✓ | ✓ |
| DELETE /reviews/:id (own) | — | ✓ | — | ✓ | ✓ | ✓ |
| GET /wishlist | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| GET /analytics/* | — | — | — | — | ✓ | ✓ |
| POST /analytics/events | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| GET /users (all) | — | — | — | — | ✓ | ✓ |
| PATCH /users/:id/role | — | — | — | — | — | ✓ |
| DELETE /users/:id | — | — | — | — | — | ✓ |
| GET /telegram/status | — | — | — | — | — | ✓ |
| POST /telegram/notify | — | — | — | — | ✓ | ✓ |

### 16.3 Ownership Rules

- `CUSTOMER` can only access own orders, own addresses, own reviews, own wishlist, own cart
- `SELLER` can only `PATCH/DELETE` products they created (`created_by_id = userId`)
- `MODERATOR` cannot modify any resource except review status (moderate action only)
- `ADMIN` cannot modify other ADMINs' accounts or assign `SUPER_ADMIN` role
- `SUPER_ADMIN` can act on any resource without ownership restriction

### 16.4 Guards Implementation (NestJS)

```typescript
// Applied globally on AppModule
JwtAuthGuard      // validates Bearer token on protected routes
RolesGuard        // checks @Roles() decorator against JWT role claim

// Route-level decorator examples
@Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
@Roles(UserRoleEnum.MODERATOR, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)

// Public routes bypass JwtAuthGuard
@Public() // custom decorator that sets metadata 'isPublic'
```

---

## Appendix A — Swagger Configuration

**Setup in** `apps/api/src/main.ts`:

```typescript
const config = new DocumentBuilder()
  .setTitle('Apple Plus API')
  .setDescription('E-commerce REST API for Apple Plus platform')
  .setVersion('1.0')
  .addBearerAuth(
    { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    'access-token',
  )
  .addServer('http://localhost:3001/api/v1', 'Local')
  .addServer('https://api.staging.appleplus.uz/api/v1', 'Staging')
  .addServer('https://api.appleplus.uz/api/v1', 'Production')
  .addTag('Auth', 'Authentication and session management')
  .addTag('Users', 'User profiles and addresses')
  .addTag('Products', 'Product catalog')
  .addTag('Categories', 'Product categories')
  .addTag('Variants', 'Product variants')
  .addTag('Inventory', 'Stock management')
  .addTag('Cart', 'Shopping cart')
  .addTag('Orders', 'Order management and checkout')
  .addTag('Payments', 'Payment processing')
  .addTag('Reviews', 'Product reviews and moderation')
  .addTag('Wishlist', 'User wishlists')
  .addTag('Analytics', 'Event tracking and reporting')
  .addTag('Telegram', 'Telegram bot integration')
  .build();
```

Swagger UI available at `/api/docs` in non-production environments.

---

## Appendix B — Enum Reference

```typescript
enum UserRoleEnum {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  SELLER = 'SELLER',
  CUSTOMER = 'CUSTOMER',
  GUEST = 'GUEST',
}

enum ProductStatusEnum {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

enum OrderStatusEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

enum PaymentStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

enum ShipmentStatusEnum {
  PREPARING = 'PREPARING',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  EXCEPTION = 'EXCEPTION',
}

enum ReviewStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

enum CouponTypeEnum {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
}

enum AnalyticsEventTypeEnum {
  PAGE_VIEWED = 'page.viewed',
  PRODUCT_VIEWED = 'product.viewed',
  PRODUCT_ADDED_TO_CART = 'product.added_to_cart',
  PRODUCT_REMOVED_FROM_CART = 'product.removed_from_cart',
  SEARCH_PERFORMED = 'search.performed',
  ORDER_INITIATED = 'order.initiated',
  ORDER_COMPLETED = 'order.completed',
  COUPON_APPLIED = 'coupon.applied',
  USER_REGISTERED = 'user.registered',
  USER_LOGGED_IN = 'user.logged_in',
  WISHLIST_ADDED = 'wishlist.added',
  WISHLIST_REMOVED = 'wishlist.removed',
  REVIEW_SUBMITTED = 'review.submitted',
}
```

---

*Generated: 2026-06-04 — Apple Plus API v1.0*
