'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { OrderResponse, OrderStatus, PaginatedResponse } from '@/lib/api-types'

export function useAdminOrders(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['admin', 'orders', page, limit],
    queryFn: () =>
      api.get<PaginatedResponse<OrderResponse>>('/orders', { page, limit }),
    staleTime: 30_000,
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.patch<OrderResponse>(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'orders'] })
    },
  })
}
