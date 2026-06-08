'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PaginatedResponse, ProductResponse } from '@/lib/api-types'

export function useSearch(q: string, filters: { categoryId?: string; brandId?: string } = {}) {
  return useQuery({
    queryKey: ['search', q, filters],
    queryFn: () =>
      api.get<PaginatedResponse<ProductResponse>>('/search', {
        q,
        categoryId: filters.categoryId,
        brandId: filters.brandId,
        limit: 20,
      }),
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
  })
}
