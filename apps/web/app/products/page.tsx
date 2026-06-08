import type { Metadata } from 'next'
import { ProductsBrowser } from '@/components/products/ProductsBrowser'

export const metadata: Metadata = {
  title: 'All Products',
  description: 'Browse our full range of Apple products and electronics.',
}

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string; new?: string; brand?: string }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams
  return (
    <ProductsBrowser
      initialCategory={params.category ?? ''}
      initialSearch={params.search ?? ''}
      initialBrand={params.brand ?? ''}
      showNewOnly={params.new === 'true'}
    />
  )
}
