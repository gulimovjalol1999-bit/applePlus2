// Mirrors backend DTOs

export interface PaginatedMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginatedMeta
}

// Auth
export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: AuthUser
  tokens: TokenPair
}

// Users (admin)
export interface UserResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: 'owner' | 'manager' | 'operator' | 'warehouse' | 'customer'
  isActive: boolean
  emailVerifiedAt: string | null
  createdAt: string
  updatedAt: string
}

// Products
export interface ProductImageResponse {
  id: string
  url: string
  altText: string | null
  sortOrder: number
  isPrimary: boolean
  variantId: string | null
}

export interface ProductVariantResponse {
  id: string
  sku: string
  name: string
  price: number
  salePrice: number | null
  attributes: Record<string, string>
  isDefault: boolean
  isActive: boolean
  weightKg: number | null
  quantity: number | null
  availableQuantity: number | null
  reorderLevel: number | null
  warehouseLocation: string | null
}

export interface ProductResponse {
  id: string
  categoryId: string | null
  categoryName: string | null
  brandId: string | null
  brandName: string | null
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  basePrice: number
  salePrice: number | null
  status: string
  tags: string[]
  metaTitle: string | null
  metaDescription: string | null
  averageRating: number
  reviewCount: number
  variantCount: number
  createdAt: string
  updatedAt: string
  images?: ProductImageResponse[]
  variants?: ProductVariantResponse[]
}

// Used phones
export type UsedPhoneConditionGrade = 'like_new' | 'excellent' | 'good' | 'fair' | 'for_parts'
export type UsedPhoneWarrantyType = 'none' | 'seller_warranty' | 'apple_warranty_remaining'
export type CarrierLockStatus = 'unlocked' | 'locked' | 'unknown'

export interface UsedPhoneDefect {
  part: string
  description: string
  severity: 'minor' | 'major'
}

export interface UsedPhoneRepairRecord {
  date: string
  description: string
}

export interface UsedPhoneResponse {
  id: string
  name: string
  slug: string
  description: string | null
  status: string
  categoryId: string
  categoryName: string | null
  brandId: string
  brandName: string | null
  images: ProductImageResponse[]

  variantId: string
  sku: string
  price: number
  salePrice: number | null
  attributes: Record<string, string>

  quantity: number
  availableQuantity: number
  soldCount: number

  imei: string
  imei2: string | null
  serialNumber: string | null
  conditionGrade: UsedPhoneConditionGrade
  batteryHealthPercent: number
  defects: UsedPhoneDefect[]
  repairHistory: UsedPhoneRepairRecord[]
  includedAccessories: string[]
  warrantyType: UsedPhoneWarrantyType
  warrantyExpiresAt: string | null
  carrierLockStatus: CarrierLockStatus
  region: string | null
  purchaseCostPrice: number
  gradeNotes: string | null
  soldAt: string | null

  createdAt: string
  updatedAt: string
}

// Categories
export interface CategoryResponse {
  id: string
  parentId: string | null
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  metaTitle: string | null
  metaDescription: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  children?: CategoryResponse[]
}

// Brands
export interface BrandResponse {
  id: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  websiteUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Reviews
export interface ReviewResponse {
  id: string
  productId: string
  userId: string
  orderId: string | null
  rating: number
  title: string | null
  body: string | null
  isApproved: boolean
  createdAt: string
  updatedAt: string
}

// Cart
export interface CartItemResponse {
  id: string
  variantId: string
  productId: string
  productName: string
  variantName: string
  sku: string
  imageUrl: string | null
  price: number
  salePrice: number | null
  quantity: number
  lineTotal: number
}

export interface CartResponse {
  id: string
  items: CartItemResponse[]
  subtotal: number
  itemCount: number
}

// Shipping addresses
export interface AddressResponse {
  id: string
  userId: string
  label: string
  fullName: string
  phone: string
  addressLine: string
  city: string
  region: string | null
  postalCode: string | null
  country: string
  isDefault: boolean
  createdAt: string
}

export interface CreateAddressRequest {
  label?: string
  fullName: string
  phone: string
  addressLine: string
  city: string
  region?: string
  postalCode?: string
  country?: string
  isDefault?: boolean
}

// Coupons
export interface CouponValidationResponse {
  valid: boolean
  discount: number
  finalAmount: number
}

// Wishlist
export interface WishlistItemResponse {
  id: string
  productId: string
  productName: string
  productSlug: string
  basePrice: number
  createdAt: string
}

// Orders
export type OrderStatus = 'new' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'

export interface OrderItemResponse {
  id: string
  productId: string
  variantId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface OrderResponse {
  id: string
  orderNumber: string
  userId: string | null
  couponId: string | null
  shippingAddressId: string | null
  status: OrderStatus
  totalAmount: number
  discountAmount: number
  shippingAmount: number
  notes: string | null
  items: OrderItemResponse[]
  createdAt: string
}

export interface PaymeCheckoutResponse {
  // null when Payme is not configured — the order completes without online payment.
  url: string | null
}

// Analytics
export interface DailySalesRow {
  date: string
  orderCount: number
  revenue: number
}

export interface MonthlyRevenueRow {
  year: number
  month: number
  orderCount: number
  revenue: number
}

export interface TopProductRow {
  productId: string
  productName: string
  totalQuantity: number
  totalRevenue: number
}

export interface TopCategoryRow {
  categoryId: string
  categoryName: string
  totalQuantity: number
  totalRevenue: number
}
