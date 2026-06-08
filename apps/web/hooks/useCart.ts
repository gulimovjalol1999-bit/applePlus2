'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import type { CartResponse } from '@/lib/api-types'

export function useBackendCart() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['cart'],
    queryFn: () => api.get<CartResponse>('/cart'),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useAddToCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      api.post<CartResponse>('/cart/items', { variantId, quantity }),
    onSuccess: (data) => {
      qc.setQueryData(['cart'], data)
    },
  })
}

export function useUpdateCartItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      api.patch<CartResponse>(`/cart/items/${variantId}`, { quantity }),
    onSuccess: (data) => {
      qc.setQueryData(['cart'], data)
    },
  })
}

export function useRemoveCartItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (variantId: string) =>
      api.del<CartResponse>(`/cart/items/${variantId}`),
    onSuccess: (data) => {
      qc.setQueryData(['cart'], data)
    },
  })
}

export function useMergeCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) =>
      api.post<CartResponse>('/cart/merge', { sessionId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}
