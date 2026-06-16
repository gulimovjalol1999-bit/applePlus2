'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export interface VariantInput {
  sku: string
  name: string
  price: number
  salePrice?: number
  attributes?: Record<string, string>
  weightKg?: number
  isDefault?: boolean
  isActive?: boolean
  initialQuantity?: number
  reorderLevel?: number
  warehouseLocation?: string
}

export interface ImageInput {
  url: string
  altText?: string
  sortOrder?: number
  isPrimary?: boolean
  variantId?: string
}

function invalidateProduct(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  queryClient.invalidateQueries({ queryKey: ['admin-product', id] })
  queryClient.invalidateQueries({ queryKey: ['products'] })
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

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => api.get<ProductResponse>(`/products/${id}`),
    enabled: !!id,
  })
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<ProductInput>) =>
      api.patch<ProductResponse>(`/products/${id}`, input),
    onSuccess: () => invalidateProduct(queryClient, id),
  })
}

export function useCreateVariant(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: VariantInput) =>
      api.post<ProductResponse>(`/products/${productId}/variants`, input),
    onSuccess: () => invalidateProduct(queryClient, productId),
  })
}

export function useUpdateVariant(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ variantId, ...input }: Partial<VariantInput> & { variantId: string }) =>
      api.patch<ProductResponse>(`/products/${productId}/variants/${variantId}`, input),
    onSuccess: () => invalidateProduct(queryClient, productId),
  })
}

export function useDeleteVariant(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (variantId: string) =>
      api.del<ProductResponse>(`/products/${productId}/variants/${variantId}`),
    onSuccess: () => invalidateProduct(queryClient, productId),
  })
}

export function useCreateImage(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ImageInput) =>
      api.post<ProductResponse>(`/products/${productId}/images`, input),
    onSuccess: () => invalidateProduct(queryClient, productId),
  })
}

export function useDeleteImage(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (imageId: string) =>
      api.del<ProductResponse>(`/products/${productId}/images/${imageId}`),
    onSuccess: () => invalidateProduct(queryClient, productId),
  })
}

export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => api.uploadImage(file),
  })
}
