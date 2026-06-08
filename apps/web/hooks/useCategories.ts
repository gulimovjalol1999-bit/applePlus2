'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CategoryResponse } from '@/lib/api-types'

export function useCategoriesTree() {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => api.get<CategoryResponse[]>('/categories/tree'),
    staleTime: 5 * 60_000,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ data: CategoryResponse[] }>('/categories', { limit: 100, isActive: true }),
    staleTime: 5 * 60_000,
  })
}
