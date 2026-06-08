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

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: AuthUser
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
  variantName: string
  sku: string
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
  status: OrderStatus
  totalAmount: number
  discountAmount: number
  shippingAmount: number
  notes: string | null
  items: OrderItemResponse[]
  createdAt: string
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
