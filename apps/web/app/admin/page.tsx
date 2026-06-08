'use client'
import { TrendingUp, ShoppingBag, Package, DollarSign, AlertCircle } from 'lucide-react'
import { useMonthlyRevenue, useTopProducts } from '@/hooks/useAnalytics'
import { useAdminOrders } from '@/hooks/useAdminOrders'
import { useProducts } from '@/hooks/useProducts'
import type { MonthlyRevenueRow, OrderResponse } from '@/lib/api-types'
import { cn } from '@/lib/utils'

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  shipping: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={cn('rounded-xl p-2', color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-ap-black">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function RevenueBar({ row, max }: { row: MonthlyRevenueRow; max: number }) {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const pct = max > 0 ? (row.revenue / max) * 100 : 0
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span className="text-[10px] text-gray-400">${row.revenue >= 1000 ? `${(row.revenue / 1000).toFixed(1)}k` : row.revenue}</span>
      <div className="relative w-full flex-1 flex items-end">
        <div
          className="w-full rounded-t bg-accent/80 transition-all"
          style={{ height: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className="text-[10px] text-gray-400">{MONTHS[row.month - 1]}</span>
    </div>
  )
}

function OrderRow({ order }: { order: OrderResponse }) {
  return (
    <tr className="border-t border-gray-100">
      <td className="py-3 pr-4 text-sm font-medium text-ap-black">{order.orderNumber}</td>
      <td className="py-3 pr-4">
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-600')}>
          {order.status}
        </span>
      </td>
      <td className="py-3 pr-4 text-sm text-gray-500">
        {new Date(order.createdAt).toLocaleDateString()}
      </td>
      <td className="py-3 text-right text-sm font-semibold text-ap-black">
        ${order.totalAmount.toFixed(2)}
      </td>
    </tr>
  )
}

export default function AdminDashboard() {
  const currentYear = new Date().getFullYear()
  const { data: revenueData, isError: revenueErr } = useMonthlyRevenue(currentYear)
  const { data: topProductsData } = useTopProducts(5)
  const { data: ordersData } = useAdminOrders(1, 8)
  const { data: productsData } = useProducts({ limit: 1, status: 'active' })

  const months: MonthlyRevenueRow[] = revenueData ?? []
  const totalRevenue = months.reduce((s, r) => s + r.revenue, 0)
  const totalOrders = ordersData?.meta?.total ?? 0
  const totalProducts = productsData?.meta?.total ?? 0
  const maxRevenue = Math.max(...months.map((r) => r.revenue), 1)
  const recentOrders: OrderResponse[] = ordersData?.data ?? []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ap-black">Dashboard</h1>
        <p className="text-sm text-gray-400">{currentYear} overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue (YTD)"
          value={`$${totalRevenue >= 1000 ? `${(totalRevenue / 1000).toFixed(1)}k` : totalRevenue.toFixed(0)}`}
          sub={`${currentYear}`}
          icon={DollarSign}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          label="Total Orders"
          value={String(totalOrders)}
          sub="all time"
          icon={ShoppingBag}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Active Products"
          value={String(totalProducts)}
          sub="in catalogue"
          icon={Package}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          label="Avg Order Value"
          value={totalOrders > 0 ? `$${(totalRevenue / totalOrders).toFixed(0)}` : '—'}
          sub="YTD"
          icon={TrendingUp}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Revenue chart + top products */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Monthly revenue bar chart */}
        <div className="col-span-2 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-ap-black">Monthly Revenue {currentYear}</h2>
          {revenueErr ? (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="h-4 w-4" /> Failed to load
            </div>
          ) : months.length === 0 ? (
            <p className="text-sm text-gray-400">No revenue data yet</p>
          ) : (
            <div className="flex h-36 items-end gap-1">
              {Array.from({ length: 12 }, (_, i) => {
                const row = months.find((r) => r.month === i + 1) ?? { month: i + 1, revenue: 0, orderCount: 0, year: currentYear }
                return <RevenueBar key={i} row={row} max={maxRevenue} />
              })}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-ap-black">Top Products</h2>
          {!topProductsData || topProductsData.length === 0 ? (
            <p className="text-sm text-gray-400">No sales data yet</p>
          ) : (
            <ul className="space-y-3">
              {topProductsData.map((p, i) => (
                <li key={p.productId} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ap-black">{p.productName}</p>
                    <p className="text-[11px] text-gray-400">{p.totalQuantity} sold</p>
                  </div>
                  <span className="text-xs font-semibold text-ap-black">
                    ${p.totalRevenue.toFixed(0)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ap-black">Recent Orders</h2>
          <a href="/admin/orders" className="text-xs font-medium text-accent hover:underline">
            View all →
          </a>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-400">No orders yet</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                {['Order #', 'Status', 'Date', 'Total'].map((h) => (
                  <th key={h} className={cn('pb-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400', h === 'Total' && 'text-right')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => <OrderRow key={o.id} order={o} />)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
