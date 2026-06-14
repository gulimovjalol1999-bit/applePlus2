'use client'
import { useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import {
  useMonthlyRevenue,
  useTopProducts,
  useTopCategories,
  useDailySales,
} from '@/hooks/useAnalytics'
import type { DailySalesRow, MonthlyRevenueRow } from '@/lib/api-types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function RevenueBar({ row, max }: { row: MonthlyRevenueRow; max: number }) {
  const pct = max > 0 ? (row.revenue / max) * 100 : 0
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span className="text-[10px] text-gray-400">
        {row.revenue >= 1000 ? `${(row.revenue / 1000).toFixed(1)}k` : row.revenue}
      </span>
      <div className="relative w-full flex-1 flex items-end">
        <div className="w-full rounded-t bg-accent/80 transition-all" style={{ height: `${Math.max(pct, 2)}%` }} />
      </div>
      <span className="text-[10px] text-gray-400">{MONTHS[row.month - 1]}</span>
    </div>
  )
}

function DailyBar({ row, max }: { row: DailySalesRow; max: number }) {
  const pct = max > 0 ? (row.revenue / max) * 100 : 0
  const label = new Date(row.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <div className="relative w-full flex-1 flex items-end">
        <div className="w-full rounded-t bg-blue-400/80 transition-all" style={{ height: `${Math.max(pct, 2)}%` }} title={`$${row.revenue.toFixed(2)} · ${row.orderCount} orders`} />
      </div>
      <span className="whitespace-nowrap text-[9px] text-gray-400">{label}</span>
    </div>
  )
}

function Panel({ title, children, error }: { title: string; children: React.ReactNode; error?: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-ap-black">{title}</h2>
      {error ? (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" /> Failed to load
        </div>
      ) : (
        children
      )}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  const { data: revenueData, isError: revenueErr, isLoading: revenueLoading } = useMonthlyRevenue(year)
  const { data: topProducts, isError: topProductsErr, isLoading: topProductsLoading } = useTopProducts(10)
  const { data: topCategories, isError: topCategoriesErr, isLoading: topCategoriesLoading } = useTopCategories(10)

  const last30 = new Date()
  last30.setDate(last30.getDate() - 30)
  const { data: dailySales, isError: dailyErr, isLoading: dailyLoading } = useDailySales(
    last30.toISOString().slice(0, 10),
    new Date().toISOString().slice(0, 10),
  )

  const months = revenueData ?? []
  const maxRevenue = Math.max(...months.map((r) => r.revenue), 1)
  const totalRevenue = months.reduce((s, r) => s + r.revenue, 0)
  const totalOrders = months.reduce((s, r) => s + r.orderCount, 0)

  const daily = dailySales ?? []
  const maxDaily = Math.max(...daily.map((r) => r.revenue), 1)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ap-black">Analytics</h1>
          <p className="text-sm text-gray-400">Sales performance overview</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:border-accent"
        >
          {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Revenue ({year})</p>
          <p className="mt-2 text-2xl font-bold text-ap-black">${totalRevenue.toFixed(0)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Orders ({year})</p>
          <p className="mt-2 text-2xl font-bold text-ap-black">{totalOrders}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
          <p className="mt-2 text-2xl font-bold text-ap-black">
            {totalOrders > 0 ? `$${(totalRevenue / totalOrders).toFixed(0)}` : '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Last 30 days revenue</p>
          <p className="mt-2 text-2xl font-bold text-ap-black">
            ${daily.reduce((s, r) => s + r.revenue, 0).toFixed(0)}
          </p>
        </div>
      </div>

      <Panel title={`Monthly Revenue ${year}`} error={revenueErr}>
        {revenueLoading ? (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-300" />
        ) : months.length === 0 ? (
          <p className="text-sm text-gray-400">No revenue data yet</p>
        ) : (
          <div className="flex h-40 items-end gap-1">
            {Array.from({ length: 12 }, (_, i) => {
              const row = months.find((r) => r.month === i + 1) ?? { month: i + 1, revenue: 0, orderCount: 0, year }
              return <RevenueBar key={i} row={row} max={maxRevenue} />
            })}
          </div>
        )}
      </Panel>

      <Panel title="Daily Sales (last 30 days)" error={dailyErr}>
        {dailyLoading ? (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-300" />
        ) : daily.length === 0 ? (
          <p className="text-sm text-gray-400">No sales data yet</p>
        ) : (
          <div className="flex h-40 items-end gap-1 overflow-x-auto">
            {daily.map((row) => <DailyBar key={row.date} row={row} max={maxDaily} />)}
          </div>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Top Products" error={topProductsErr}>
          {topProductsLoading ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-300" />
          ) : !topProducts || topProducts.length === 0 ? (
            <p className="text-sm text-gray-400">No sales data yet</p>
          ) : (
            <ul className="space-y-3">
              {topProducts.map((p, i) => (
                <li key={p.productId} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ap-black">{p.productName}</p>
                    <p className="text-[11px] text-gray-400">{p.totalQuantity} sold</p>
                  </div>
                  <span className="text-sm font-semibold text-ap-black">${p.totalRevenue.toFixed(0)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Top Categories" error={topCategoriesErr}>
          {topCategoriesLoading ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-300" />
          ) : !topCategories || topCategories.length === 0 ? (
            <p className="text-sm text-gray-400">No sales data yet</p>
          ) : (
            <ul className="space-y-3">
              {topCategories.map((c, i) => (
                <li key={c.categoryId} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ap-black">{c.categoryName}</p>
                    <p className="text-[11px] text-gray-400">{c.totalQuantity} sold</p>
                  </div>
                  <span className="text-sm font-semibold text-ap-black">${c.totalRevenue.toFixed(0)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
