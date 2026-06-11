'use client'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CouponValidationResponse } from '@/lib/api-types'

export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({ code, orderAmount }: { code: string; orderAmount: number }) =>
      api.post<CouponValidationResponse>('/coupons/validate', { code, orderAmount }),
  })
}
