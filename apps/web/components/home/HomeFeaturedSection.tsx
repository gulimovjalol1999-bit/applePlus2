'use client'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { ProductCard } from '@/components/products/ProductCard'
import { toDisplayProduct } from '@/lib/adapters'
import type { ProductResponse } from '@/lib/api-types'

interface Props {
  title: string
  subtitle: string
  viewAllHref: string
  filters?: Parameters<typeof useProducts>[0]
}

export function HomeFeaturedSection({ title, subtitle, viewAllHref, filters = {} }: Props) {
  const { data, isLoading } = useProducts({ limit: 8, status: 'active', ...filters })

  const apiProducts: ProductResponse[] = data?.data ?? []
  const displayProducts = apiProducts.map(toDisplayProduct)

  if (isLoading || displayProducts.length === 0) return null

  return (
    <section className="container-ap py-20">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            {subtitle}
          </span>
          <h2 className="mt-1 text-3xl font-bold text-ap-black">{title}</h2>
        </div>
        <Link
          href={viewAllHref}
          className="hidden sm:flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
