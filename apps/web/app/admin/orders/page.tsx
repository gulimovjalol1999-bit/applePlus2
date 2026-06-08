'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, Loader2 } from 'lucide-react'
import { useAdminOrders, useUpdateOrderStatus } from '@/hooks/useAdminOrders'
import type { OrderResponse, OrderStatus } from '@/lib/api-types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  shipping: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['delivered'],
  delivered: [],
  cancelled: [],
}

function StatusSelect({ order }: { order: OrderResponse }) {
  const [open, setOpen] = useState(false)
  const update = useUpdateOrderStatus()
  const next = TRANSITIONS[order.status]

  if (next.length === 0) {
    return (
      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', STATUS_STYLE[order.status])}>
        {order.status}
      </span>
    )
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={update.isPending}
        className={cn(
          'flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize transition-opacity',
          STATUS_STYLE[order.status],
          update.isPending && 'opacity-60',
        )}
      >
        {update.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : order.status}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-36 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          {next.map((s) => (
            <button
              key={s}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium capitalize text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setOpen(false)
                update.mutate(
                  { id: order.id, status: s },
                  {
                    onSuccess: () => toast.success(`Order ${order.orderNumber} → ${s}`),
                    onError: (e) => toast.error((e as Error).message),
                  },
                )
              }}
            >
              <span className={cn('h-2 w-2 rounded-full', STATUS_STYLE[s]?.split(' ')[0])} />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useAdminOrders(page, 20)

  const orders = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ap-black">Orders</h1>
        <p className="text-sm text-gray-400">
          {meta ? `${meta.total} total orders` : 'Loading…'}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {isError ? (
          <div className="p-8 text-center text-sm text-red-500">Failed to load orders.</div>
        ) : isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No orders found.</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {['Order #', 'Status', 'Items', 'Date', 'Total'].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400',
                      h === 'Total' && 'text-right',
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-ap-black">
                    {order.orderNumber}
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelect order={order} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-ap-black">
                    ${order.totalAmount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>
            Page {meta.page} of {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={page === meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
