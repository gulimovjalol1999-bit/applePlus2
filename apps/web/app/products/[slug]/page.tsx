'use client'
import { use } from 'react'
import { notFound } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useProductBySlug, useProducts } from '@/hooks/useProducts'
import { toDisplayProduct } from '@/lib/adapters'
import { ProductDetailClient } from '@/components/products/ProductDetailClient'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function ProductDetailPage({ params }: PageProps) {
  const { slug } = use(params)
  const { data: product, isLoading, isError } = useProductBySlug(slug)

  const { data: relatedData } = useProducts({
    limit: 4,
    categoryId: product?.categoryId ?? undefined,
    status: 'active',
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-ap-text3" />
      </div>
    )
  }

  if (isError || !product) {
    notFound()
  }

  const displayProduct = toDisplayProduct(product)
  const relatedProducts = (relatedData?.data ?? [])
    .filter((p) => p.id !== product.id)
    .slice(0, 4)
    .map(toDisplayProduct)

  return <ProductDetailClient product={displayProduct} related={relatedProducts} />
}
