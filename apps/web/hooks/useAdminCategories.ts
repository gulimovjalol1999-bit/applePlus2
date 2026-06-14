'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CategoryResponse } from '@/lib/api-types'

export interface CategoryInput {
  name: string
  parentId?: string | null
  description?: string
  imageUrl?: string
  sortOrder?: number
  isActive?: boolean
}

function invalidateCategories(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['categories'] })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CategoryInput) => api.post<CategoryResponse>('/categories', input),
    onSuccess: () => invalidateCategories(queryClient),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: CategoryInput & { id: string }) =>
      api.patch<CategoryResponse>(`/categories/${id}`, input),
    onSuccess: () => invalidateCategories(queryClient),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.del(`/categories/${id}`),
    onSuccess: () => invalidateCategories(queryClient),
  })
}
