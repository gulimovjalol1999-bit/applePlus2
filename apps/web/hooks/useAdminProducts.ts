'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ProductResponse } from '@/lib/api-types'

export interface ProductInput {
  categoryId: string
  brandId: string
  name: string
  description?: string
  shortDescription?: string
  basePrice: number
  salePrice?: number
  status?: 'draft' | 'active' | 'archived'
  tags?: string[]
  metaTitle?: string
  metaDescription?: string
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductInput) => api.post<ProductResponse>('/products', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
