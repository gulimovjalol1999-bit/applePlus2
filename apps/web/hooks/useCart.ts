'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import type { CartResponse } from '@/lib/api-types'

const CART_KEY = ['cart']

export function useCart() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: [...CART_KEY, isAuthenticated],
    queryFn: () => api.get<CartResponse>(isAuthenticated ? '/cart' : '/cart/guest'),
    staleTime: 10_000,
  })
}

export function useAddToCart() {
  const qc = useQueryClient()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      api.post<CartResponse>(
        isAuthenticated ? '/cart/items' : '/cart/guest/items',
        { variantId, quantity },
      ),
    onSuccess: (data) => { qc.setQueryData([...CART_KEY, isAuthenticated], data) },
  })
}

export function useUpdateCartItem() {
  const qc = useQueryClient()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      api.patch<CartResponse>(
        isAuthenticated ? `/cart/items/${variantId}` : `/cart/guest/items/${variantId}`,
        { quantity },
      ),
    onSuccess: (data) => { qc.setQueryData([...CART_KEY, isAuthenticated], data) },
  })
}

export function useRemoveCartItem() {
  const qc = useQueryClient()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useMutation({
    mutationFn: (variantId: string) =>
      api.del<CartResponse>(
        isAuthenticated ? `/cart/items/${variantId}` : `/cart/guest/items/${variantId}`,
      ),
    onSuccess: (data) => { qc.setQueryData([...CART_KEY, isAuthenticated], data) },
  })
}

export function useClearCart() {
  const qc = useQueryClient()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useMutation({
    mutationFn: () => api.del<void>(isAuthenticated ? '/cart' : '/cart/guest'),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: CART_KEY }) },
  })
}

export function useMergeCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => api.post<CartResponse>('/cart/merge', { sessionId }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: CART_KEY }) },
  })
}
