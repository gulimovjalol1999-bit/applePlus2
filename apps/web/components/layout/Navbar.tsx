'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Search, Menu, X, User, ChevronDown, LogOut } from 'lucide-react'
import { useCartUIStore } from '@/stores/cart'
import { useCart } from '@/hooks/useCart'
import { brands as MOCK_BRANDS } from '@/lib/mock-data'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import { useLogout } from '@/hooks/useAuth'
import { useBrands } from '@/hooks/useBrands'

const APPLE_NAV = [
  { label: 'iPhone', category: 'smartphones', icon: 'smartphones' },
  { label: 'Mac', category: 'laptops', icon: 'laptops' },
  { label: 'iPad', category: 'tablets', icon: 'tablets' },
  { label: 'Watch', category: 'smartwatches', icon: 'smartwatches' },
  { label: 'AirPods', category: 'headphones', icon: 'headphones' },
  { label: 'Accessories', category: 'accessories', icon: 'accessories' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [brandsOpen, setBrandsOpen] = useState(false)
  const { data: cart } = useCart()
  const count = cart?.itemCount ?? 0
  const openCart = useCartUIStore((s) => s.openCart)
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const logout = useLogout()
  const { data: brandsData } = useBrands()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close brands dropdown on outside click
  useEffect(() => {
    if (!brandsOpen) return
    const handler = () => setBrandsOpen(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [brandsOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const allBrands = brandsData?.data ?? MOCK_BRANDS
  const otherBrands = allBrands.filter((b) => b.slug !== 'apple')

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-ap-gray2 bg-white/90 backdrop-blur-xl shadow-sm'
          : 'border-b border-transparent bg-white/80 backdrop-blur-xl'
      )}
    >
      <nav className="container-ap flex h-14 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0 text-xl font-bold tracking-tight text-ap-black">
          Apple+
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-0.5">
          {APPLE_NAV.map((item) => (
            <li key={item.label}>
              <Link
                href={`/products?category=${item.category}&brand=apple`}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-ap-text2 transition-colors hover:bg-ap-gray1 hover:text-ap-black"
              >
                {item.label}
              </Link>
            </li>
          ))}

          {/* All Brands dropdown */}
          <li className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setBrandsOpen((o) => !o) }}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-ap-text2 transition-colors hover:bg-ap-gray1 hover:text-ap-black"
            >
              All Brands <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', brandsOpen && 'rotate-180')} />
            </button>
            {brandsOpen && (
              <div
                className="absolute left-0 top-full mt-2 w-44 rounded-2xl border border-ap-gray2 bg-white py-2 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  href="/products"
                  onClick={() => setBrandsOpen(false)}
                  className="block px-4 py-2 text-sm font-semibold text-ap-black hover:bg-ap-gray1 transition-colors"
                >
                  All Products
                </Link>
                <div className="my-1 border-t border-ap-gray2" />
                <Link
                  href="/products?brand=apple"
                  onClick={() => setBrandsOpen(false)}
                  className="block px-4 py-2 text-sm text-ap-text2 hover:bg-ap-gray1 hover:text-ap-black transition-colors"
                >
                  Apple
                </Link>
                {otherBrands.map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/products?brand=${brand.slug}`}
                    onClick={() => setBrandsOpen(false)}
                    className="block px-4 py-2 text-sm text-ap-text2 hover:bg-ap-gray1 hover:text-ap-black transition-colors"
                  >
                    {brand.name}
                  </Link>
                ))}
              </div>
            )}
          </li>
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setSearchOpen(true); setMobileOpen(false) }}
            className="rounded-full p-2 text-ap-text2 hover:bg-ap-gray1 hover:text-ap-black transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          {isAuthenticated ? (
            <div className="hidden sm:flex items-center gap-1">
              {user?.role && ['owner', 'manager', 'operator', 'warehouse'].includes(user.role) && (
                <Link
                  href="/admin"
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-accent border border-accent/30 hover:bg-accent/10 transition-colors"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={() => logout.mutate()}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-ap-text2 hover:bg-ap-gray1 hover:text-ap-black transition-colors"
                title={`${user?.firstName} ${user?.lastName}`}
              >
                <User className="h-4 w-4" />
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:flex rounded-full p-2 text-ap-text2 hover:bg-ap-gray1 hover:text-ap-black transition-colors"
              aria-label="Account"
            >
              <User className="h-5 w-5" />
            </Link>
          )}

          <button
            onClick={openCart}
            className="relative rounded-full p-2 text-ap-text2 hover:bg-ap-gray1 hover:text-ap-black transition-colors"
            aria-label={`Cart (${count} items)`}
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>

          <button
            onClick={() => { setMobileOpen(!mobileOpen); setSearchOpen(false) }}
            className="md:hidden rounded-full p-2 text-ap-text2 hover:bg-ap-gray1 transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-t border-ap-gray2 bg-white/95 backdrop-blur-xl">
          <form onSubmit={handleSearch} className="container-ap flex items-center gap-3 py-3">
            <Search className="h-5 w-5 shrink-0 text-ap-text3" />
            <input
              autoFocus
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search iPhone, MacBook, AirPods…"
              className="flex-1 bg-transparent text-base text-ap-black placeholder:text-ap-text3 outline-none"
            />
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setSearchQuery('') }}
              className="rounded-full p-1.5 text-ap-text2 hover:bg-ap-gray1 hover:text-ap-black transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-ap-gray2 bg-white md:hidden">
          {/* Apple products */}
          <div className="container-ap pt-4 pb-2">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ap-text3">Apple</p>
            <ul className="grid grid-cols-3 gap-2">
              {APPLE_NAV.map((item) => {
                const Icon = CATEGORY_ICONS[item.icon]
                return (
                  <li key={item.label}>
                    <Link
                      href={`/products?category=${item.category}&brand=apple`}
                      onClick={() => setMobileOpen(false)}
                      className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-colors hover:bg-ap-gray1"
                    >
                      {Icon && <Icon className="h-5 w-5 text-ap-text2" />}
                      <span className="text-xs font-medium text-ap-black">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Other brands */}
          <div className="container-ap border-t border-ap-gray2 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ap-text3">More Brands</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/products"
                onClick={() => setMobileOpen(false)}
                className="rounded-full border border-ap-gray2 px-3 py-1 text-xs font-medium text-ap-black hover:bg-ap-gray1 transition-colors"
              >
                All Products
              </Link>
              {otherBrands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/products?brand=${brand.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full border border-ap-gray2 px-3 py-1 text-xs font-medium text-ap-text2 hover:bg-ap-gray1 hover:text-ap-black transition-colors"
                >
                  {brand.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="container-ap border-t border-ap-gray2 py-4 flex gap-4">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center rounded-full py-2 text-sm font-medium border border-ap-gray2 text-ap-black hover:bg-ap-gray1 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center rounded-full py-2 text-sm font-medium bg-accent text-white hover:opacity-90 transition-opacity"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
