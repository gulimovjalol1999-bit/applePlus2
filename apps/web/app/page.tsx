import Link from 'next/link'
import { ArrowRight, Shield, Truck, RotateCcw } from 'lucide-react'
import { HomeCategoriesSection } from '@/components/home/HomeCategoriesSection'
import { HomeFeaturedSection } from '@/components/home/HomeFeaturedSection'

export default function HomePage() {
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden bg-[#1d1d1f] text-center text-white px-4">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/50" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center gap-6 animate-fade-in">
          <span className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
            New Arrivals 2026
          </span>

          <h1 className="max-w-4xl text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            Premium Electronics,
            <br />
            <span className="text-accent-dark">Delivered Fast</span>
          </h1>

          <p className="max-w-xl text-lg text-white/65">
            iPhone 16 Pro, MacBook Air M3, AirPods Pro — discover the latest Apple products at
            unbeatable prices.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Shop All Products <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/products?category=smartphones&brand=apple"
              className="inline-flex items-center rounded-full border border-white/25 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              iPhone 16 Pro →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Value props ─────────────────────────────────────────── */}
      <section className="border-b border-ap-gray2 bg-ap-gray1">
        <div className="container-ap grid grid-cols-1 divide-y divide-ap-gray2 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { icon: Truck, title: 'Free Shipping', sub: 'On orders over $50' },
            { icon: RotateCcw, title: '30-Day Returns', sub: 'Hassle-free returns' },
            { icon: Shield, title: '2-Year Warranty', sub: 'Apple-certified service' },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-4 px-8 py-5">
              <div className="rounded-xl bg-accent/10 p-3">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ap-black">{title}</p>
                <p className="text-xs text-ap-text2">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories (client – fetches from API) ──────────────── */}
      <HomeCategoriesSection />

      {/* ── Featured Products (client – fetches from API) ────────── */}
      <HomeFeaturedSection
        title="Featured Products"
        subtitle="Hand-picked"
        viewAllHref="/products"
      />

      {/* ── Promo banner ─────────────────────────────────────────── */}
      <section className="container-ap pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-[#1d1d1f] px-8 py-16 text-center text-white">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-transparent" />
          <div className="relative z-10">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
              Limited Offer
            </span>
            <h2 className="mt-4 text-4xl font-bold">Trade In &amp; Save Up to $800</h2>
            <p className="mt-3 text-lg text-white/65 max-w-lg mx-auto">
              Trade in your old device and get instant credit toward the new iPhone 16 Pro.
            </p>
            <Link
              href="/products?category=smartphones&brand=apple"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-ap-black hover:bg-ap-gray1 transition-colors"
            >
              Shop iPhone <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
