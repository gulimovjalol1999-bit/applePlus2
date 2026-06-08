'use client'
import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, Loader2, Package } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import type { ProductResponse } from '@/lib/api-types'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-500',
}

function ProductRow({ product }: { product: ProductResponse }) {
  const primaryImage = product.images?.find((i) => i.isPrimary) ?? product.images?.[0]
  const price = product.salePrice ?? product.basePrice

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage.url}
              alt={product.name}
              className="h-9 w-9 rounded-lg object-cover bg-gray-100"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
              <Package className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ap-black max-w-[220px]">{product.name}</p>
            <p className="text-[11px] text-gray-400">{product.slug}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{product.categoryName ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-500">{product.brandName ?? '—'}</td>
      <td className="px-4 py-3">
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', STATUS_STYLE[product.status] ?? 'bg-gray-100 text-gray-500')}>
          {product.status}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end">
          {product.salePrice && (
            <span className="text-[11px] text-gray-400 line-through">${product.basePrice.toFixed(2)}</span>
          )}
          <span className={cn('text-sm font-semibold', product.salePrice ? 'text-accent' : 'text-ap-black')}>
            ${price.toFixed(2)}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-center text-sm text-gray-500">{product.reviewCount}</td>
    </tr>
  )
}

export default function AdminProductsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<string>('')

  const { data, isLoading, isError } = useProducts({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: status || undefined,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  })

  const products = data?.data ?? []
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
          <h1 className="text-xl font-bold text-ap-black">Products</h1>
          <p className="text-sm text-gray-400">
            {meta ? `${meta.total} products` : 'Loading…'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 w-52"
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
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {isError ? (
          <div className="p-8 text-center text-sm text-red-500">Failed to load products.</div>
        ) : isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No products found.</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {[
                  { label: 'Product', align: 'left' },
                  { label: 'Category', align: 'left' },
                  { label: 'Brand', align: 'left' },
                  { label: 'Status', align: 'left' },
                  { label: 'Price', align: 'right' },
                  { label: 'Reviews', align: 'center' },
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
              {products.map((p) => <ProductRow key={p.id} product={p} />)}
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
