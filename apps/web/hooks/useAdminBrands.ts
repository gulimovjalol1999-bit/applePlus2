'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { BrandResponse, PaginatedResponse } from '@/lib/api-types'

export interface BrandInput {
  name: string
  description?: string
  logoUrl?: string
  websiteUrl?: string
  isActive?: boolean
}

function invalidateBrands(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['brands'] })
  queryClient.invalidateQueries({ queryKey: ['admin-brands'] })
}

export function useAdminBrands() {
  return useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => api.get<PaginatedResponse<BrandResponse>>('/brands', { limit: 100 }),
  })
}

export function useCreateBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BrandInput) => api.post<BrandResponse>('/brands', input),
    onSuccess: () => invalidateBrands(queryClient),
  })
}

export function useUpdateBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: BrandInput & { id: string }) =>
      api.patch<BrandResponse>(`/brands/${id}`, input),
    onSuccess: () => invalidateBrands(queryClient),
  })
}

export function useDeleteBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.del(`/brands/${id}`),
    onSuccess: () => invalidateBrands(queryClient),
  })
}
