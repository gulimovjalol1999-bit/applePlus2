'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { BrandResponse, PaginatedResponse } from '@/lib/api-types'

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: () =>
      api.get<PaginatedResponse<BrandResponse>>('/brands', { limit: 100, isActive: true }),
    staleTime: 5 * 60_000,
  })
}
