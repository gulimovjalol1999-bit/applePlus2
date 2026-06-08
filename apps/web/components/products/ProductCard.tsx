'use client'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { type Product } from '@/lib/mock-data'
import { useCartStore } from '@/stores/cart'
import { cn, formatPrice } from '@/lib/utils'
import { StarRating } from '@/components/ui/StarRating'

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      cartItemId: product.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0].url,
      price: product.price,
    })
    toast.success('Added to cart', { description: product.name })
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'group relative flex flex-col rounded-2xl bg-ap-gray1 overflow-hidden',
        'transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5',
        className
      )}
    >
      {/* Badges */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        {product.isNew && (
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
            New
          </span>
        )}
        {product.discountPercent && (
          <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
            -{product.discountPercent}%
          </span>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-ap-gray1">
        <Image
          src={product.images[0].url}
          alt={product.images[0].alt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Quick add */}
        <button
          onClick={handleAddToCart}
          className={cn(
            'absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md',
            'text-ap-black transition-all duration-200',
            'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0',
            'hover:bg-accent hover:text-white'
          )}
          aria-label="Add to cart"
        >
          <ShoppingBag className="h-4 w-4" />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-ap-text3">
          {product.brand}
        </p>
        <h3 className="font-semibold text-ap-black leading-snug line-clamp-2 text-sm sm:text-base">
          {product.name}
        </h3>
        <StarRating rating={product.rating} reviewCount={product.reviewCount} className="mt-0.5" />
        <div className="mt-2 flex items-center gap-2">
          <span className="font-bold text-ap-black">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-xs text-ap-text3 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
        {product.colors && product.colors.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            {product.colors.slice(0, 5).map((c) => (
              <span
                key={c.id}
                title={c.name}
                className="h-3.5 w-3.5 rounded-full border border-ap-gray3 shadow-sm"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {product.colors.length > 5 && (
              <span className="text-[10px] text-ap-text3">+{product.colors.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
