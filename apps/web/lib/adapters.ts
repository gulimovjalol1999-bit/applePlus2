import type { ProductResponse, ProductVariantResponse } from './api-types'
import type { Product, ColorVariant, StorageVariant } from './mock-data'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80'

function extractColors(variants: ProductVariantResponse[]): ColorVariant[] {
  const seen = new Set<string>()
  const colors: ColorVariant[] = []
  for (const v of variants) {
    const color = v.attributes['color'] ?? v.attributes['Color']
    const hex = v.attributes['colorHex'] ?? v.attributes['hex']
    if (color && !seen.has(color)) {
      seen.add(color)
      colors.push({ id: v.id, name: color, hex: hex ?? '#888888' })
    }
  }
  return colors
}

function extractStorages(
  variants: ProductVariantResponse[],
  basePrice: number,
): StorageVariant[] {
  const seen = new Set<string>()
  const storages: StorageVariant[] = []
  for (const v of variants) {
    const storage = v.attributes['storage'] ?? v.attributes['Storage']
    if (storage && !seen.has(storage)) {
      seen.add(storage)
      storages.push({
        id: v.id,
        label: storage,
        priceDelta: v.price - basePrice,
      })
    }
  }
  return storages
}

export function toDisplayProduct(p: ProductResponse): Product {
  const price = p.salePrice ?? p.basePrice
  const discountPercent = p.salePrice
    ? Math.round(((p.basePrice - p.salePrice) / p.basePrice) * 100)
    : undefined

  const images =
    p.images && p.images.length > 0
      ? p.images
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((img) => ({ url: img.url, alt: img.altText ?? p.name }))
      : [{ url: FALLBACK_IMAGE, alt: p.name }]

  const colors = p.variants ? extractColors(p.variants) : undefined
  const storages =
    p.variants && p.variants.some((v) => v.attributes['storage'] || v.attributes['Storage'])
      ? extractStorages(p.variants, p.basePrice)
      : undefined

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brandName ?? '',
    category: p.categoryName ?? '',
    categorySlug: '',
    price,
    originalPrice: p.salePrice ? p.basePrice : undefined,
    discountPercent,
    images,
    rating: p.averageRating,
    reviewCount: p.reviewCount,
    inStock: true,
    isNew: false,
    colors: colors && colors.length > 0 ? colors : undefined,
    storages: storages && storages.length > 0 ? storages : undefined,
    specs: [],
    description: p.description ?? p.shortDescription ?? '',
    features: p.tags ?? [],
    tags: p.tags ?? [],
  }
}
