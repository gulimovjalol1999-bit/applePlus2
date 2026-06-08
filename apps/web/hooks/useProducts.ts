'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PaginatedResponse, ProductResponse } from '@/lib/api-types'

export interface ProductFilters {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  brandId?: string
  status?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () =>
      api.get<PaginatedResponse<ProductResponse>>('/products', {
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
        search: filters.search,
        categoryId: filters.categoryId,
        brandId: filters.brandId,
        status: filters.status ?? 'active',
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }),
    staleTime: 60_000,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get<ProductResponse>(`/products/${id}`),
    enabled: !!id,
    staleTime: 60_000,
  })
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ['product', 'slug', slug],
    queryFn: () => api.get<ProductResponse>(`/products/slug/${slug}`),
    enabled: !!slug,
    staleTime: 60_000,
  })
}
