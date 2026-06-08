'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  MonthlyRevenueRow,
  TopProductRow,
  TopCategoryRow,
} from '@/lib/api-types'

export function useMonthlyRevenue(year?: number) {
  return useQuery({
    queryKey: ['analytics', 'monthly-revenue', year],
    queryFn: () =>
      api.get<MonthlyRevenueRow[]>('/analytics/monthly-revenue', year ? { year } : {}),
    staleTime: 5 * 60_000,
  })
}

export function useTopProducts(limit = 5) {
  return useQuery({
    queryKey: ['analytics', 'top-products', limit],
    queryFn: () => api.get<TopProductRow[]>('/analytics/top-products', { limit }),
    staleTime: 5 * 60_000,
  })
}

export function useTopCategories(limit = 5) {
  return useQuery({
    queryKey: ['analytics', 'top-categories', limit],
    queryFn: () => api.get<TopCategoryRow[]>('/analytics/top-categories', { limit }),
    staleTime: 5 * 60_000,
  })
}
