'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, ChevronLeft, Check, Truck, RotateCcw, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { type Product } from '@/lib/mock-data'
import { useAddToCart } from '@/hooks/useCart'
import { cn, formatPrice } from '@/lib/utils'
import { StarRating } from '@/components/ui/StarRating'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/products/ProductCard'
import { reviews } from '@/lib/mock-data'

interface ProductDetailClientProps {
  product: Product
  related: Product[]
}

function getAttr(v: { attributes: Record<string, string> }, keys: string[]): string | undefined {
  for (const k of keys) {
    if (v.attributes[k]) return v.attributes[k]
  }
  return undefined
}

export function ProductDetailClient({ product, related }: ProductDetailClientProps) {
  const [mainImage, setMainImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] ?? null)
  const [selectedStorage, setSelectedStorage] = useState(product.storages?.[0] ?? null)
  const [qty, setQty] = useState(1)
  const addToCart = useAddToCart()

  const activeVariants = product.variants?.filter((v) => v.isActive) ?? []
  const matchedVariant =
    activeVariants.find((v) => {
      const colorMatch = !selectedColor || getAttr(v, ['color', 'Color']) === selectedColor.name
      const storageMatch =
        !selectedStorage || getAttr(v, ['storage', 'Storage']) === selectedStorage.label
      return colorMatch && storageMatch
    }) ?? activeVariants[0]

  const finalPrice = matchedVariant
    ? (matchedVariant.salePrice ?? matchedVariant.price)
    : product.price + (selectedStorage?.priceDelta ?? 0)

  const originalPrice = matchedVariant?.salePrice
    ? matchedVariant.price
    : product.originalPrice
  const discountPercent = matchedVariant?.salePrice
    ? Math.round(
        ((matchedVariant.price - matchedVariant.salePrice) / matchedVariant.price) * 100,
      )
    : product.discountPercent

  const handleAddToCart = () => {
    if (!matchedVariant) {
      toast.error('This combination is currently unavailable')
      return
    }
    addToCart.mutate(
      { variantId: matchedVariant.id, quantity: qty },
      {
        onSuccess: () => toast.success('Added to cart!', { description: product.name }),
        onError: (err) => toast.error((err as Error).message),
      },
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="container-ap py-4">
        <nav className="flex items-center gap-1 text-sm text-ap-text2">
          <Link href="/" className="hover:text-ap-black transition-colors">Home</Link>
          <span className="mx-1">/</span>
          <Link href="/products" className="hover:text-ap-black transition-colors">Products</Link>
          <span className="mx-1">/</span>
          <Link
            href={`/products?category=${product.categorySlug}`}
            className="hover:text-ap-black transition-colors"
          >
            {product.category}
          </Link>
          <span className="mx-1">/</span>
          <span className="text-ap-black font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* Main layout */}
      <div className="container-ap pb-16">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Gallery */}
          <div className="flex flex-col gap-3">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-ap-gray1">
              <Image
                src={product.images[mainImage]?.url ?? product.images[0].url}
                alt={product.images[mainImage]?.alt ?? product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              {product.isNew && (
                <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                  New
                </span>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setMainImage(i)}
                    className={cn(
                      'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all',
                      mainImage === i ? 'border-accent' : 'border-transparent hover:border-ap-gray3'
                    )}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-ap-text3 mb-1">
                {product.brand}
              </p>
              <h1 className="text-3xl font-bold text-ap-black leading-tight">{product.name}</h1>
              <div className="mt-2 flex items-center gap-3">
                <StarRating rating={product.rating} reviewCount={product.reviewCount} size="md" />
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-ap-black">{formatPrice(finalPrice)}</span>
              {originalPrice && (
                <span className="text-lg text-ap-text3 line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
              {discountPercent && (
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-sm font-semibold text-red-500">
                  Save {discountPercent}%
                </span>
              )}
            </div>

            {/* Color selector */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <p className="mb-2.5 text-sm font-semibold text-ap-black">
                  Color: <span className="font-normal text-ap-text2">{selectedColor?.name}</span>
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedColor(c)}
                      title={c.name}
                      className={cn(
                        'relative h-8 w-8 rounded-full border-2 transition-all',
                        selectedColor?.id === c.id
                          ? 'border-accent scale-110 shadow-md'
                          : 'border-ap-gray3 hover:border-ap-black'
                      )}
                      style={{ backgroundColor: c.hex }}
                    >
                      {selectedColor?.id === c.id && (
                        <Check
                          className="absolute inset-0 m-auto h-3.5 w-3.5"
                          style={{ color: parseInt(c.hex.slice(1), 16) > 0x888888 ? '#000' : '#fff' }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Storage selector */}
            {product.storages && product.storages.length > 0 && (
              <div>
                <p className="mb-2.5 text-sm font-semibold text-ap-black">Storage</p>
                <div className="flex flex-wrap gap-2">
                  {product.storages.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStorage(s)}
                      className={cn(
                        'rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all',
                        selectedStorage?.id === s.id
                          ? 'border-accent bg-blue-50 text-accent'
                          : 'border-ap-gray2 text-ap-black hover:border-ap-black'
                      )}
                    >
                      {s.label}
                      {s.priceDelta > 0 && (
                        <span className="ml-1.5 text-ap-text3">+{formatPrice(s.priceDelta)}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty + Add to cart */}
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-full border border-ap-gray2">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="flex h-12 w-12 items-center justify-center rounded-full text-ap-text2 hover:bg-ap-gray1 hover:text-ap-black transition-colors text-lg font-medium"
                >
                  −
                </button>
                <span className="w-8 text-center font-semibold">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="flex h-12 w-12 items-center justify-center rounded-full text-ap-text2 hover:bg-ap-gray1 hover:text-ap-black transition-colors text-lg font-medium"
                >
                  +
                </button>
              </div>
              <Button
                onClick={handleAddToCart}
                size="lg"
                className="flex-1 gap-2"
                disabled={!matchedVariant || addToCart.isPending}
              >
                <ShoppingBag className="h-5 w-5" />
                Add to Cart
              </Button>
            </div>

            {matchedVariant ? (
              <p className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <Check className="h-4 w-4" /> In Stock — ships within 1–2 days
              </p>
            ) : (
              <p className="text-sm text-red-500 font-medium">Out of Stock</p>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-ap-gray1 p-4">
              {[
                { icon: Truck, label: 'Free Shipping', sub: 'Orders over $50' },
                { icon: RotateCcw, label: 'Easy Returns', sub: '30-day policy' },
                { icon: Shield, label: '2-Year Warranty', sub: 'Apple-certified' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-1 text-center">
                  <Icon className="h-5 w-5 text-accent" />
                  <span className="text-xs font-semibold text-ap-black">{label}</span>
                  <span className="text-[10px] text-ap-text3">{sub}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-base font-semibold text-ap-black mb-2">About this item</h3>
              <p className="text-sm leading-relaxed text-ap-text2">{product.description}</p>
            </div>

            {/* Features */}
            {product.features.length > 0 && (
              <ul className="space-y-1.5">
                {product.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ap-text2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Specs */}
        {product.specs.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-ap-black mb-6">Specifications</h2>
            <div className="rounded-2xl border border-ap-gray2 overflow-hidden">
              {product.specs.map((spec, i) => (
                <div
                  key={spec.key}
                  className={cn(
                    'flex items-start gap-4 px-6 py-4',
                    i % 2 === 0 ? 'bg-white' : 'bg-ap-gray1'
                  )}
                >
                  <span className="w-36 shrink-0 text-sm font-medium text-ap-text2">{spec.key}</span>
                  <span className="text-sm text-ap-black">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-ap-black mb-2">Customer Reviews</h2>
          <div className="mb-6 flex items-center gap-4">
            <span className="text-5xl font-bold text-ap-black">{product.rating.toFixed(1)}</span>
            <div>
              <StarRating rating={product.rating} size="md" />
              <p className="mt-1 text-sm text-ap-text2">{product.reviewCount.toLocaleString()} reviews</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-ap-gray2 bg-white p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-ap-black text-sm">{r.author}</p>
                    <p className="text-xs text-ap-text3">{r.date}</p>
                  </div>
                  <StarRating rating={r.rating} />
                </div>
                <p className="text-sm font-semibold text-ap-black mb-1">{r.title}</p>
                <p className="text-sm leading-relaxed text-ap-text2">{r.body}</p>
                {r.verified && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-green-600">
                    <Check className="h-3 w-3" /> Verified purchase
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-ap-black mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
