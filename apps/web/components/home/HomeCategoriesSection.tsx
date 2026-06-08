'use client'
import Link from 'next/link'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { useCategories } from '@/hooks/useCategories'
import { categories as MOCK_CATEGORIES } from '@/lib/mock-data'

export function HomeCategoriesSection() {
  const { data: categoriesData } = useCategories()
  const cats = categoriesData?.data ?? MOCK_CATEGORIES

  return (
    <section className="container-ap py-20">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-ap-black">Shop by Category</h2>
          <p className="mt-1 text-ap-text2">Find exactly what you&apos;re looking for</p>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
        {cats.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.slug]
          const count = (cat as { productCount?: number }).productCount
          return (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group flex flex-col items-center gap-3 rounded-2xl bg-ap-gray1 p-5 text-center transition-all hover:bg-ap-gray2 hover:shadow-sm"
            >
              <div className="rounded-xl bg-white p-3 shadow-sm group-hover:shadow-md transition-shadow">
                {Icon && (
                  <Icon className="h-6 w-6 text-ap-black group-hover:text-accent transition-colors" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-ap-black group-hover:text-accent transition-colors">
                {cat.name}
              </span>
              {count !== undefined && (
                <span className="hidden sm:block text-[10px] text-ap-text3">{count} items</span>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
