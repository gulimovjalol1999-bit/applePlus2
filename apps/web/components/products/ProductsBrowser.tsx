'use client'
import { useState, useMemo, useEffect } from 'react'
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { ProductCard } from '@/components/products/ProductCard'
import { cn } from '@/lib/utils'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { useBrands } from '@/hooks/useBrands'
import { toDisplayProduct } from '@/lib/adapters'


// Map backend category slug → Apple marketing name
const APPLE_CATEGORY_NAMES: Record<string, string> = {
  smartphones: 'iPhone',
  laptops: 'Mac',
  tablets: 'iPad',
  smartwatches: 'Apple Watch',
  headphones: 'AirPods',
  accessories: 'Apple Accessories',
}

interface ProductsBrowserProps {
  initialCategory?: string
  initialSearch?: string
  initialBrand?: string
  showNewOnly?: boolean
}

export function ProductsBrowser({
  initialCategory = '',
  initialSearch = '',
  initialBrand = '',
  showNewOnly = false,
}: ProductsBrowserProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [activeBrand, setActiveBrand] = useState(initialBrand)
  const [query, setQuery] = useState(initialSearch)
  const [sortBy, setSortBy] = useState('featured')
  const [page] = useState(1)

  useEffect(() => { setActiveCategory(initialCategory) }, [initialCategory])
  useEffect(() => { setActiveBrand(initialBrand) }, [initialBrand])
  useEffect(() => { setQuery(initialSearch) }, [initialSearch])

  // ---- Resolve IDs from slugs ----
  const { data: categoriesData } = useCategories()
  const { data: brandsData } = useBrands()

  const apiCategories = categoriesData?.data ?? []
  const apiBrands = brandsData?.data ?? []

  const displayCategories = apiCategories
  const displayBrands = apiBrands

  const activeCategoryId = useMemo(() => {
    if (!activeCategory || apiCategories.length === 0) return undefined
    return apiCategories.find((c) => c.slug === activeCategory)?.id
  }, [activeCategory, apiCategories])

  const activeBrandId = useMemo(() => {
    if (!activeBrand || apiBrands.length === 0) return undefined
    return apiBrands.find((b) => b.slug === activeBrand)?.id
  }, [activeBrand, apiBrands])

  // ---- Backend sort mapping ----
  const sortParams = useMemo(() => {
    switch (sortBy) {
      case 'price-asc': return { sortBy: 'basePrice', sortOrder: 'ASC' as const }
      case 'price-desc': return { sortBy: 'basePrice', sortOrder: 'DESC' as const }
      case 'rating': return { sortBy: 'averageRating', sortOrder: 'DESC' as const }
      default: return { sortBy: 'createdAt', sortOrder: 'DESC' as const }
    }
  }, [sortBy])

  const { data: productsData, isLoading } = useProducts({
    page,
    limit: 40,
    search: query.trim() || undefined,
    categoryId: activeCategoryId,
    brandId: activeBrandId,
    status: 'active',
    ...sortParams,
  })

  const apiProducts = productsData?.data ?? []
  const totalCount = productsData?.meta?.total ?? 0

  const activeCategoryName = displayCategories.find((c) => c.slug === activeCategory)?.name
  const activeBrandName = displayBrands.find((b) => b.slug === activeBrand)?.name

  const pageTitle = useMemo(() => {
    if (showNewOnly) return 'New Arrivals'
    if (activeBrand === 'apple' && activeCategory) return APPLE_CATEGORY_NAMES[activeCategory] ?? activeCategoryName ?? 'All Products'
    if (activeCategoryName && activeBrandName) return `${activeBrandName} ${activeCategoryName}`
    if (activeBrandName) return activeBrandName
    return activeCategoryName ?? 'All Products'
  }, [showNewOnly, activeBrand, activeCategory, activeCategoryName, activeBrandName])

  const clearAll = () => { setQuery(''); setActiveCategory(''); setActiveBrand('') }

  return (
    <div className="container-ap py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ap-black">{pageTitle}</h1>
        <p className="mt-1 text-sm text-ap-text2">{totalCount} products</p>
      </div>

      {/* Search + Sort */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-52 items-center gap-2 rounded-full border border-ap-gray2 bg-ap-gray1 px-4 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-ap-text3" />
          <input
            type="search"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-ap-black placeholder:text-ap-text3 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-ap-text2" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 rounded-full border border-ap-gray2 bg-ap-gray1 px-4 text-sm text-ap-black outline-none cursor-pointer"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Brand filter */}
      {displayBrands.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-ap-text3 mr-1">Brand</span>
          <button
            onClick={() => setActiveBrand('')}
            className={cn('rounded-full px-4 py-1.5 text-sm font-medium transition-all', activeBrand === '' ? 'bg-ap-black text-white' : 'bg-ap-gray1 text-ap-text2 hover:bg-ap-gray2')}
          >
            All
          </button>
          {displayBrands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => setActiveBrand(brand.slug)}
              className={cn('rounded-full px-4 py-1.5 text-sm font-medium transition-all', activeBrand === brand.slug ? 'bg-ap-black text-white' : 'bg-ap-gray1 text-ap-text2 hover:bg-ap-gray2')}
            >
              {brand.name}
            </button>
          ))}
        </div>
      )}

      {/* Category filter */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ap-text3 mr-1">Category</span>
        <button
          onClick={() => setActiveCategory('')}
          className={cn('rounded-full px-4 py-1.5 text-sm font-medium transition-all', activeCategory === '' ? 'bg-ap-black text-white' : 'bg-ap-gray1 text-ap-text2 hover:bg-ap-gray2')}
        >
          All
        </button>
        {displayCategories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.slug]
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              className={cn('inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all', activeCategory === cat.slug ? 'bg-ap-black text-white' : 'bg-ap-gray1 text-ap-text2 hover:bg-ap-gray2')}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {cat.name}
            </button>
          )
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-ap-text3" />
        </div>
      )}

      {/* Product grid */}
      {!isLoading && (
        <>
          {apiProducts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg text-ap-text2">No products found.</p>
              <button onClick={clearAll} className="mt-4 text-sm text-accent hover:underline">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {apiProducts.map((p) => (
                <ProductCard key={p.id} product={toDisplayProduct(p)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
