'use client'
import { Tag, X } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { CouponValidationResponse } from '@/lib/api-types'

const inputClass =
  'w-full rounded-xl border border-ap-gray2 bg-ap-gray1 px-4 py-2.5 text-sm text-ap-black placeholder:text-ap-text3 outline-none transition-all focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20'

interface OrderSummaryProps {
  itemCount: number
  subtotal: number
  discount: number
  total: number
  appliedCoupon: (CouponValidationResponse & { code: string }) | null
  couponCode: string
  onCouponCodeChange: (code: string) => void
  onApplyCoupon: () => void
  onRemoveCoupon: () => void
  isValidatingCoupon: boolean
  onPlaceOrder: () => void
  isPlacingOrder: boolean
  canPlaceOrder: boolean
}

export function OrderSummary({
  itemCount,
  subtotal,
  discount,
  total,
  appliedCoupon,
  couponCode,
  onCouponCodeChange,
  onApplyCoupon,
  onRemoveCoupon,
  isValidatingCoupon,
  onPlaceOrder,
  isPlacingOrder,
  canPlaceOrder,
}: OrderSummaryProps) {
  return (
    <div className="sticky top-20 rounded-2xl border border-ap-gray2 bg-ap-gray1 p-6">
      <h2 className="text-lg font-bold text-ap-black mb-5">Order Summary</h2>

      {/* Coupon */}
      <div className="mb-5">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ap-black">
          <Tag className="h-4 w-4 text-accent" /> Coupon code
        </p>
        {appliedCoupon ? (
          <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2 text-sm">
            <span className="font-medium text-green-700">{appliedCoupon.code} applied</span>
            <button onClick={onRemoveCoupon} className="text-green-700 hover:text-red-500">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              placeholder="Enter code"
              value={couponCode}
              onChange={(e) => onCouponCodeChange(e.target.value)}
              className={inputClass}
            />
            <Button type="button" variant="outline" onClick={onApplyCoupon} isLoading={isValidatingCoupon}>
              Apply
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-ap-text2">
          <span>Subtotal ({itemCount} items)</span>
          <span className="text-ap-black font-medium">{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span className="font-medium">-{formatPrice(discount)}</span>
          </div>
        )}
        <p className="text-xs text-ap-text3">
          Shipping cost will be calculated when your order is confirmed
        </p>
        <div className="border-t border-ap-gray2 pt-3 flex justify-between">
          <span className="font-bold text-ap-black">Total</span>
          <span className="font-bold text-ap-black text-lg">{formatPrice(total)}</span>
        </div>
      </div>

      <div className="mt-6">
        <Button
          className="w-full"
          size="lg"
          onClick={onPlaceOrder}
          isLoading={isPlacingOrder}
          disabled={!canPlaceOrder}
        >
          Place Order
        </Button>
      </div>
    </div>
  )
}
