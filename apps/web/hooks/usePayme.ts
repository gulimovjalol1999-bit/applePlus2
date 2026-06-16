'use client'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PaymeCheckoutResponse } from '@/lib/api-types'

/**
 * Requests a Payme hosted-checkout URL for an order. The caller redirects the
 * customer to the returned URL to enter their card on Payme's page.
 */
export function usePaymeCheckout() {
  return useMutation({
    mutationFn: (orderId: string) =>
      api.post<PaymeCheckoutResponse>('/payments/payme/checkout', { orderId }),
  })
}
