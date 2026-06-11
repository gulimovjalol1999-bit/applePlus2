'use client'
import { use } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2, Package } from 'lucide-react'
import { useOrder } from '@/hooks/useOrders'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { OrderStatus } from '@/lib/api-types'

interface PageProps {
  params: Promise<{ id: string }>
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  shipping: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function OrderConfirmationPage({ params }: PageProps) {
  const { id } = use(params)
  const { data: order, isLoading, isError } = useOrder(id)

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-ap-text3" />
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="container-ap flex flex-col items-center justify-center gap-4 py-32 text-center">
        <Package className="h-12 w-12 text-ap-gray3" />
        <h1 className="text-xl font-bold text-ap-black">Order not found</h1>
        <Link href="/products">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    )
  }

  const itemsTotal = order.items.reduce((sum, i) => sum + i.totalPrice, 0)

  return (
    <div className="container-ap flex justify-center py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-green-50 p-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-ap-black">Order placed successfully!</h1>
          <p className="text-ap-text2">
            Thank you for your order. We&apos;ll notify you once it ships.
          </p>
        </div>

        <div className="rounded-2xl border border-ap-gray2 bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-ap-text2">Order number</p>
              <p className="font-mono text-lg font-bold text-ap-black">{order.orderNumber}</p>
            </div>
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold capitalize',
                STATUS_STYLE[order.status],
              )}
            >
              {order.status}
            </span>
          </div>

          <ul className="divide-y divide-ap-gray2">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-ap-black truncate">{item.productName}</p>
                  <p className="text-sm text-ap-text2">
                    {item.quantity} × {formatPrice(item.unitPrice)}
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-ap-black">
                  {formatPrice(item.totalPrice)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-2 border-t border-ap-gray2 pt-4 text-sm">
            <div className="flex justify-between text-ap-text2">
              <span>Items subtotal</span>
              <span className="text-ap-black font-medium">{formatPrice(itemsTotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span className="font-medium">-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            {order.shippingAmount > 0 && (
              <div className="flex justify-between text-ap-text2">
                <span>Shipping</span>
                <span className="text-ap-black font-medium">{formatPrice(order.shippingAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-ap-gray2 pt-2 text-base">
              <span className="font-bold text-ap-black">Total</span>
              <span className="font-bold text-ap-black">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          {order.notes && (
            <p className="mt-4 rounded-xl bg-ap-gray1 p-3 text-sm text-ap-text2">{order.notes}</p>
          )}
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <Link href="/products">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
