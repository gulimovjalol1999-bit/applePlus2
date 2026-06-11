'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { OrderResponse } from '@/lib/api-types'

export interface CreateOrderRequest {
  items: { variantId: string; quantity: number }[]
  couponCode?: string
  shippingAddressId?: string
  notes?: string
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get<OrderResponse>(`/orders/${id}`),
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      dto,
      idempotencyKey,
    }: {
      dto: CreateOrderRequest
      idempotencyKey: string
    }) =>
      api.post<OrderResponse>('/orders', dto, {
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cart'] }) },
  })
}
