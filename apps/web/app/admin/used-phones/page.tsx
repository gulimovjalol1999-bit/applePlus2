'use client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Search, ChevronLeft, ChevronRight, Loader2, Smartphone, Plus } from 'lucide-react'
import { useUsedPhones, useMarkUsedPhoneSold } from '@/hooks/useAdminUsedPhones'
import type { CarrierLockStatus, UsedPhoneConditionGrade, UsedPhoneResponse } from '@/lib/api-types'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-500',
}

const CONDITION_STYLE: Record<string, string> = {
  like_new: 'bg-green-100 text-green-700',
  excellent: 'bg-green-100 text-green-700',
  good: 'bg-blue-100 text-blue-700',
  fair: 'bg-yellow-100 text-yellow-700',
  for_parts: 'bg-gray-100 text-gray-500',
}

const CONDITION_LABEL: Record<string, string> = {
  like_new: 'Like New',
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  for_parts: 'For Parts',
}

function batteryStyle(pct: number) {
  if (pct >= 80) return 'bg-green-100 text-green-700'
  if (pct >= 50) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

function UsedPhoneRow({ phone }: { phone: UsedPhoneResponse }) {
  const primaryImage = phone.images?.find((i) => i.isPrimary) ?? phone.images?.[0]
  const price = phone.salePrice ?? phone.price
  const markSold = useMarkUsedPhoneSold(phone.id)

  function handleMarkSold() {
    if (!window.confirm('Mark this phone as sold? This will archive the listing.')) return
    markSold.mutate(undefined, {
      onSuccess: () => toast.success('Marked as sold'),
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <Link href={`/admin/used-phones/${phone.id}`} className="flex items-center gap-3">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage.url}
              alt={phone.name}
              className="h-9 w-9 rounded-lg object-cover bg-gray-100"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
              <Smartphone className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ap-black hover:text-accent max-w-[220px]">{phone.name}</p>
            <p className="text-[11px] text-gray-400">{phone.slug}</p>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{phone.imei}</td>
      <td className="px-4 py-3">
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', CONDITION_STYLE[phone.conditionGrade] ?? 'bg-gray-100 text-gray-500')}>
          {CONDITION_LABEL[phone.conditionGrade] ?? phone.conditionGrade}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', batteryStyle(phone.batteryHealthPercent))}>
          {phone.batteryHealthPercent}%
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end">
          {phone.salePrice && (
            <span className="text-[11px] text-gray-400 line-through">${phone.price.toFixed(2)}</span>
          )}
          <span className={cn('text-sm font-semibold', phone.salePrice ? 'text-accent' : 'text-ap-black')}>
            ${price.toFixed(2)}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', STATUS_STYLE[phone.status] ?? 'bg-gray-100 text-gray-500')}>
          {phone.status}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        {phone.soldAt ? (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
            Sold {new Date(phone.soldAt).toLocaleDateString()}
          </span>
        ) : (
          <button
            onClick={handleMarkSold}
            disabled={markSold.isPending}
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40"
          >
            {markSold.isPending ? 'Marking…' : 'Mark Sold'}
          </button>
        )}
      </td>
    </tr>
  )
}

export default function AdminUsedPhonesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [conditionGrade, setConditionGrade] = useState<string>('')
  const [carrierLockStatus, setCarrierLockStatus] = useState<string>('')

  const { data, isLoading, isError } = useUsedPhones({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: status || undefined,
    conditionGrade: (conditionGrade || undefined) as UsedPhoneConditionGrade | undefined,
    carrierLockStatus: (carrierLockStatus || undefined) as CarrierLockStatus | undefined,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  })

  const phones = data?.data ?? []
  const meta = data?.meta

  function handleSearchChange(val: string) {
    setSearch(val)
    clearTimeout((window as Window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer)
    ;(window as Window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 350)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ap-black">Used Phones</h1>
          <p className="text-sm text-gray-400">
            {meta ? `${meta.total} used phones` : 'Loading…'}
          </p>
        </div>
        <Link
          href="/admin/used-phones/new"
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Used Phone
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search by name, IMEI, serial…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 w-64"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:border-accent"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={conditionGrade}
          onChange={(e) => { setConditionGrade(e.target.value); setPage(1) }}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:border-accent"
        >
          <option value="">All conditions</option>
          <option value="like_new">Like New</option>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="for_parts">For Parts</option>
        </select>
        <select
          value={carrierLockStatus}
          onChange={(e) => { setCarrierLockStatus(e.target.value); setPage(1) }}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:border-accent"
        >
          <option value="">All carrier locks</option>
          <option value="unlocked">Unlocked</option>
          <option value="locked">Locked</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {isError ? (
          <div className="p-8 text-center text-sm text-red-500">Failed to load used phones.</div>
        ) : isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : phones.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No used phones found.</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {[
                  { label: 'Phone', align: 'left' },
                  { label: 'IMEI', align: 'left' },
                  { label: 'Condition', align: 'left' },
                  { label: 'Battery', align: 'left' },
                  { label: 'Price', align: 'right' },
                  { label: 'Status', align: 'left' },
                  { label: 'Sold', align: 'center' },
                ].map(({ label, align }) => (
                  <th
                    key={label}
                    className={cn(
                      'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400',
                      align === 'right' && 'text-right',
                      align === 'center' && 'text-center',
                      align === 'left' && 'text-left',
                    )}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {phones.map((p) => <UsedPhoneRow key={p.id} phone={p} />)}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>Page {meta.page} of {meta.totalPages}</span>
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
