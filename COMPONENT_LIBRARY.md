# Apple Plus — Component Library

> All components with props, variants, Tailwind classes, and TSX usage examples.  
> Stack: **Tailwind CSS 3.4 + shadcn/ui + Next.js 14**  
> Date: 2026-06-04

---

## Setup

```bash
# Install shadcn/ui
npx shadcn@latest init

# Tailwind config (key additions)
# tailwind.config.ts → extend colors, animation, fontFamily
```

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent:   { DEFAULT: '#0071e3', dark: '#2997ff', hover: '#0077ed' },
        surface:  { DEFAULT: '#ffffff', raised: '#fbfbfd' },
        ap:       {
          black:  '#1d1d1f',
          gray1:  '#f5f5f7',
          gray2:  '#e8e8ed',
          gray3:  '#d2d2d7',
          text2:  '#6e6e73',
          text3:  '#a1a1a6',
        },
      },
      fontFamily: {
        sans: ['"SF Pro Text"', '"Inter"', 'system-ui', 'sans-serif'],
        display: ['"SF Pro Display"', '"Inter Display"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '20px', xl3: '24px' },
      animation: {
        'fade-in':   'fadeIn 0.4s ease-out',
        'slide-up':  'slideUp 0.5s cubic-bezier(0.25,0.1,0.25,1)',
        'scale-in':  'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'shimmer':   'shimmer 1.8s infinite',
      },
    },
  },
} satisfies Config
```

---

## Component Index

1. [Button](#1-button)
2. [ProductCard](#2-productcard)
3. [ProductGallery](#3-productgallery)
4. [VariantPicker](#4-variantpicker)
5. [PriceDisplay](#5-pricedisplay)
6. [CategoryCard](#6-categorycard)
7. [SearchBar](#7-searchbar)
8. [CartDrawer](#8-cartdrawer)
9. [CartItem](#9-cartitem)
10. [CheckoutStepper](#10-checkoutstepper)
11. [ReviewCard](#11-reviewcard)
12. [StarRating](#12-starrating)
13. [ProductFilters](#13-productfilters)
14. [CompareBar](#14-comparebar)
15. [WishlistButton](#15-wishlistbutton)
16. [Header](#16-header)
17. [MobileNav](#17-mobilenav)
18. [StatsCard (Admin)](#18-statscard-admin)
19. [DataTable (Admin)](#19-datatable-admin)
20. [SkeletonCard](#20-skeletoncard)
21. [EmptyState](#21-emptystate)
22. [ThemeToggle](#22-themetoggle)
23. [CountdownTimer](#23-countdowntimer)
24. [Breadcrumbs](#24-breadcrumbs)
25. [NotificationToast](#25-notificationtoast)

---

## 1. Button

**shadcn/ui base + Apple-style extensions**

```tsx
// components/ui/button.tsx — extend shadcn variants
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary: Apple blue filled
        default:   'bg-accent text-white rounded-full hover:bg-accent-hover active:scale-[0.98]',
        // Outline: border + transparent
        outline:   'border-2 border-accent text-accent bg-transparent rounded-full hover:bg-accent/5 active:scale-[0.98]',
        // Ghost: no border, light bg
        ghost:     'bg-transparent text-ap-black dark:text-white hover:bg-ap-gray1 dark:hover:bg-white/10 rounded-full',
        // Destructive
        destructive:'bg-[#ff3b30] text-white rounded-full hover:bg-[#ff453a]',
        // Light surface
        secondary: 'bg-ap-gray1 text-ap-black rounded-full hover:bg-ap-gray2 dark:bg-white/10 dark:text-white dark:hover:bg-white/20',
      },
      size: {
        sm:   'h-8  px-4  text-[13px]',
        md:   'h-10 px-6  text-[15px]',
        lg:   'h-12 px-8  text-[17px]',
        xl:   'h-14 px-10 text-[17px]',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
)
```

**Usage examples:**
```tsx
<Button>Add to Cart</Button>
<Button variant="outline">Learn more</Button>
<Button variant="ghost" size="icon"><Heart /></Button>
<Button size="xl" className="w-full">Place Order — $1,248</Button>
```

---

## 2. ProductCard

**Props:**
```ts
interface ProductCardProps {
  id: string
  slug: string
  name: string
  brand: string
  imageUrl: string
  price: number
  originalPrice?: number
  rating: number
  reviewCount: number
  inStock: boolean
  isNew?: boolean
  discountPercent?: number
  className?: string
}
```

**Component:**
```tsx
// components/product/ProductCard.tsx
export function ProductCard({
  slug, name, imageUrl, price, originalPrice,
  rating, reviewCount, inStock, isNew, discountPercent
}: ProductCardProps) {
  return (
    <div className={cn(
      'group relative flex flex-col rounded-2xl bg-ap-gray1 dark:bg-[#1c1c1e]',
      'overflow-hidden cursor-pointer',
      'transition-all duration-300 ease-out',
      'hover:shadow-lg hover:scale-[1.02]',
    )}>
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {isNew && (
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-white">
            New
          </span>
        )}
        {discountPercent && (
          <span className="rounded-full bg-[#ff3b30] px-2.5 py-0.5 text-[11px] font-semibold text-white">
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* Wishlist — visible on hover */}
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <WishlistButton productId={id} />
      </div>

      {/* Image */}
      <div className="relative aspect-square overflow-hidden p-6">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-4 pt-2">
        <p className="text-[13px] text-ap-text2">{brand}</p>
        <h3 className="text-[15px] font-semibold text-ap-black dark:text-white line-clamp-2">
          {name}
        </h3>
        <StarRating value={rating} count={reviewCount} size="sm" />
        <PriceDisplay price={price} originalPrice={originalPrice} />
        {!inStock && (
          <p className="text-[13px] text-[#ff3b30]">Out of stock</p>
        )}
      </div>

      {/* Add to Cart — slides up on hover */}
      <div className="overflow-hidden max-h-0 group-hover:max-h-16 transition-all duration-300">
        <div className="px-4 pb-4">
          <Button
            size="md"
            className="w-full"
            disabled={!inStock}
            onClick={(e) => { e.preventDefault(); /* addToCart */ }}
          >
            {inStock ? 'Add to Cart' : 'Notify Me'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 3. ProductGallery

```tsx
// components/product/ProductGallery.tsx
interface ProductGalleryProps {
  images: { url: string; alt: string }[]
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-6">
      {/* Thumbnails */}
      <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:w-20">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={cn(
              'relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-colors',
              i === activeIndex
                ? 'border-accent'
                : 'border-transparent hover:border-ap-gray3'
            )}
          >
            <Image src={img.url} alt={img.alt} fill className="object-contain p-1" />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div
        className="relative flex-1 aspect-square rounded-2xl bg-ap-gray1 dark:bg-[#1c1c1e] overflow-hidden cursor-zoom-in"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <Image
          src={images[activeIndex].url}
          alt={images[activeIndex].alt}
          fill
          priority
          className={cn(
            'object-contain p-8 transition-transform duration-300',
            isZoomed && 'scale-150'
          )}
          style={isZoomed ? {
            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
          } : undefined}
        />

        {/* Mobile counter */}
        <div className="absolute bottom-3 right-3 bg-black/40 text-white text-[12px] rounded-full px-2 py-0.5 lg:hidden">
          {activeIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  )
}
```

---

## 4. VariantPicker

```tsx
// components/product/VariantPicker.tsx
interface ColorVariant  { id: string; name: string; hex: string }
interface StorageVariant { id: string; label: string; price: number }

interface VariantPickerProps {
  colors?: ColorVariant[]
  storages?: StorageVariant[]
  selectedColor?: string
  selectedStorage?: string
  onColorChange?: (id: string) => void
  onStorageChange?: (id: string) => void
}

export function VariantPicker({
  colors, storages, selectedColor, selectedStorage,
  onColorChange, onStorageChange
}: VariantPickerProps) {
  return (
    <div className="space-y-5">
      {/* Color */}
      {colors && colors.length > 0 && (
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ap-text2 uppercase tracking-wider">
            Color — <span className="normal-case font-normal text-ap-black dark:text-white">
              {colors.find(c => c.id === selectedColor)?.name}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map(color => (
              <button
                key={color.id}
                onClick={() => onColorChange?.(color.id)}
                title={color.name}
                className={cn(
                  'w-9 h-9 rounded-full transition-all duration-150',
                  'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-black',
                  selectedColor === color.id
                    ? 'ring-accent scale-110'
                    : 'ring-transparent hover:ring-ap-gray3 hover:scale-105'
                )}
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Storage / Size */}
      {storages && storages.length > 0 && (
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ap-text2 uppercase tracking-wider">
            Storage
          </p>
          <div className="flex flex-wrap gap-2">
            {storages.map(storage => (
              <button
                key={storage.id}
                onClick={() => onStorageChange?.(storage.id)}
                className={cn(
                  'px-4 py-2 rounded-lg border text-[14px] font-medium transition-all duration-150',
                  selectedStorage === storage.id
                    ? 'bg-accent border-accent text-white'
                    : 'border-ap-gray3 dark:border-[#3a3a3c] text-ap-black dark:text-white hover:border-accent hover:text-accent'
                )}
              >
                {storage.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 5. PriceDisplay

```tsx
// components/product/PriceDisplay.tsx
interface PriceDisplayProps {
  price: number
  originalPrice?: number
  showFrom?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  currency?: string
}

const sizeClasses = {
  sm: 'text-[14px]',
  md: 'text-[17px]',
  lg: 'text-[22px]',
  xl: 'text-[28px]',
}

export function PriceDisplay({
  price, originalPrice, showFrom = false,
  size = 'md', currency = 'USD'
}: PriceDisplayProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className={cn('font-semibold text-ap-black dark:text-white', sizeClasses[size])}>
        {showFrom && <span className="font-normal text-ap-text2 text-[13px] mr-1">From</span>}
        {fmt(price)}
      </span>
      {originalPrice && originalPrice > price && (
        <span className={cn('line-through text-ap-text2', sizeClasses[size])}>
          {fmt(originalPrice)}
        </span>
      )}
    </div>
  )
}
```

---

## 6. CategoryCard

```tsx
// components/product/CategoryCard.tsx
interface CategoryCardProps {
  name: string
  slug: string
  icon: React.ReactNode
  productCount?: number
}

export function CategoryCard({ name, slug, icon, productCount }: CategoryCardProps) {
  return (
    <Link href={`/category/${slug}`}>
      <div className={cn(
        'flex flex-col items-center justify-center gap-3 p-6',
        'rounded-2xl bg-ap-gray1 dark:bg-[#1c1c1e]',
        'cursor-pointer select-none',
        'transition-all duration-200',
        'hover:bg-ap-gray2 dark:hover:bg-[#2c2c2e] hover:scale-[1.04] hover:shadow-md',
        'active:scale-[0.98]',
      )}>
        <div className="text-5xl">{icon}</div>
        <p className="text-[15px] font-semibold text-ap-black dark:text-white text-center">
          {name}
        </p>
        {productCount !== undefined && (
          <p className="text-[12px] text-ap-text2">{productCount.toLocaleString()} products</p>
        )}
      </div>
    </Link>
  )
}
```

---

## 7. SearchBar

```tsx
// components/shared/SearchBar.tsx
'use client'

export function SearchBar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!debouncedQuery) { setResults([]); return }
    searchProducts(debouncedQuery).then(setResults)
  }, [debouncedQuery])

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-ap-gray1 dark:bg-white/10 hover:bg-ap-gray2 dark:hover:bg-white/20 transition-colors text-ap-text2 text-[14px]"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:block">Search</span>
        <kbd className="hidden lg:block text-[11px] px-1.5 py-0.5 bg-white dark:bg-white/10 rounded border border-ap-gray3 dark:border-white/20">⌘K</kbd>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xl" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-xl overflow-hidden animate-scale-in">
            {/* Input */}
            <div className="flex items-center gap-3 px-4 h-16 border-b border-ap-gray2 dark:border-[#2c2c2e]">
              <Search className="w-5 h-5 text-ap-text2 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search products, brands, categories..."
                className="flex-1 text-[17px] bg-transparent outline-none text-ap-black dark:text-white placeholder:text-ap-text3"
              />
              {query && (
                <button onClick={() => setQuery('')}>
                  <X className="w-4 h-4 text-ap-text2" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-[13px] text-ap-text2 px-2 py-1 rounded-md bg-ap-gray1 dark:bg-white/10"
              >
                Esc
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {results.length > 0 ? (
                results.map(r => (
                  <SearchResultItem key={r.id} result={r} onSelect={() => setOpen(false)} />
                ))
              ) : query ? (
                <p className="p-4 text-center text-ap-text2">No results for "{query}"</p>
              ) : (
                <RecentSearches />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

---

## 8. CartDrawer

```tsx
// components/cart/CartDrawer.tsx
// Uses shadcn Sheet component
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export function CartDrawer() {
  const { isOpen, close, items, itemCount } = useCartStore()

  return (
    <Sheet open={isOpen} onOpenChange={close}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-[420px] p-0">
        <SheetHeader className="px-6 py-5 border-b border-ap-gray2 dark:border-[#2c2c2e]">
          <SheetTitle className="text-[20px] font-semibold">
            Cart ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="w-12 h-12 text-ap-text3" />}
              title="Your cart is empty"
              description="Looks like you haven't added anything yet."
              action={<Button variant="outline" onClick={close}>Browse Products</Button>}
            />
          ) : (
            items.map(item => <CartItem key={item.id} item={item} />)
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-6 border-t border-ap-gray2 dark:border-[#2c2c2e] space-y-4">
            <PromoCodeInput />
            <CartSummaryRow label="Subtotal" value={subtotal} />
            <CartSummaryRow label="Shipping" value={shipping} free={shipping === 0} />
            {discount > 0 && <CartSummaryRow label="Discount" value={-discount} accent />}
            <div className="border-t border-ap-gray2 dark:border-[#2c2c2e] pt-3">
              <CartSummaryRow label="Total" value={total} bold />
            </div>
            <Button size="xl" className="w-full" asChild>
              <Link href="/checkout">Proceed to Checkout</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
```

---

## 9. CartItem

```tsx
// components/cart/CartItem.tsx
export function CartItem({ item }: { item: CartItemType }) {
  const { updateQuantity, removeItem } = useCartStore()

  return (
    <div className="flex gap-4 group">
      {/* Image */}
      <div className="relative w-20 h-20 shrink-0 rounded-xl bg-ap-gray1 dark:bg-[#2c2c2e] overflow-hidden">
        <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-2" />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-ap-black dark:text-white line-clamp-1">{item.name}</p>
        <p className="text-[13px] text-ap-text2 mt-0.5">{item.variantLabel}</p>

        <div className="flex items-center justify-between mt-3">
          {/* Qty stepper */}
          <div className="flex items-center gap-0 rounded-full border border-ap-gray3 dark:border-[#3a3a3c]">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-ap-gray1 dark:hover:bg-white/10 rounded-l-full transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-[14px] font-medium select-none">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-ap-gray1 dark:hover:bg-white/10 rounded-r-full transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Price */}
          <PriceDisplay price={item.price * item.quantity} size="sm" />
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => removeItem(item.id)}
        className="opacity-0 group-hover:opacity-100 self-start mt-1 transition-opacity text-ap-text3 hover:text-[#ff3b30]"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
```

---

## 10. CheckoutStepper

```tsx
// components/checkout/CheckoutStepper.tsx
interface Step { id: number; label: string }

const STEPS: Step[] = [
  { id: 1, label: 'Contact' },
  { id: 2, label: 'Shipping' },
  { id: 3, label: 'Payment' },
  { id: 4, label: 'Review' },
]

export function CheckoutStepper({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Checkout progress" className="flex items-center gap-0">
      {STEPS.map((step, i) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-1.5">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold transition-all duration-300',
              step.id < currentStep
                ? 'bg-accent text-white'
                : step.id === currentStep
                  ? 'bg-accent text-white ring-4 ring-accent/20'
                  : 'bg-ap-gray2 dark:bg-[#2c2c2e] text-ap-text2'
            )}>
              {step.id < currentStep
                ? <Check className="w-4 h-4" />
                : step.id
              }
            </div>
            <span className={cn(
              'text-[11px] font-medium hidden sm:block',
              step.id === currentStep ? 'text-accent' : 'text-ap-text2'
            )}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn(
              'flex-1 h-0.5 mx-2 mb-4 transition-colors duration-500',
              step.id < currentStep ? 'bg-accent' : 'bg-ap-gray2 dark:bg-[#2c2c2e]'
            )} />
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
```

---

## 11. ReviewCard

```tsx
// components/product/ReviewCard.tsx
interface ReviewCardProps {
  author: string
  rating: number
  date: string
  title: string
  body: string
  verified: boolean
  helpful: number
}

export function ReviewCard({ author, rating, date, title, body, verified, helpful }: ReviewCardProps) {
  const [helpfulCount, setHelpfulCount] = useState(helpful)
  const [voted, setVoted] = useState(false)

  return (
    <div className="py-5 border-b border-ap-gray2 dark:border-[#2c2c2e] last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <StarRating value={rating} size="sm" />
            {verified && (
              <span className="text-[11px] font-medium text-[#34c759] flex items-center gap-1">
                <Check className="w-3 h-3" /> Verified Purchase
              </span>
            )}
          </div>
          <h4 className="text-[15px] font-semibold text-ap-black dark:text-white">{title}</h4>
          <p className="mt-1 text-[14px] text-ap-text2 leading-relaxed">{body}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[13px] font-medium text-ap-black dark:text-white">{author}</p>
          <p className="text-[12px] text-ap-text3">{date}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={() => { if (!voted) { setHelpfulCount(n => n + 1); setVoted(true) } }}
          className={cn(
            'flex items-center gap-1.5 text-[13px] transition-colors',
            voted ? 'text-accent' : 'text-ap-text2 hover:text-ap-black dark:hover:text-white'
          )}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          Helpful ({helpfulCount})
        </button>
        <button className="text-[13px] text-ap-text3 hover:text-ap-text2 transition-colors">Report</button>
      </div>
    </div>
  )
}
```

---

## 12. StarRating

```tsx
// components/shared/StarRating.tsx
interface StarRatingProps {
  value: number       // 0–5, supports decimals
  count?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (value: number) => void
}

export function StarRating({ value, count, size = 'md', interactive, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const display = hovered ?? value

  const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-6 h-6' }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            disabled={!interactive}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(null)}
            onClick={() => onChange?.(star)}
            className={cn('transition-colors', interactive && 'cursor-pointer hover:scale-110')}
          >
            <Star
              className={cn(
                sizes[size],
                star <= display
                  ? 'fill-[#ff9f0a] text-[#ff9f0a]'
                  : star - 0.5 <= display
                    ? 'fill-[#ff9f0a]/50 text-[#ff9f0a]'
                    : 'fill-none text-ap-gray3'
              )}
            />
          </button>
        ))}
      </div>
      {count !== undefined && (
        <span className="text-[13px] text-ap-text2 ml-1">({count.toLocaleString()})</span>
      )}
    </div>
  )
}
```

---

## 13. ProductFilters

```tsx
// components/product/ProductFilters.tsx
// Uses shadcn Checkbox, Slider, Accordion
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'

export function ProductFilters({ filters, onChange }: ProductFiltersProps) {
  return (
    <aside className="w-full space-y-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[17px] font-semibold text-ap-black dark:text-white">Filters</h2>
        <button onClick={onChange.clearAll} className="text-[13px] text-accent hover:underline">
          Clear all
        </button>
      </div>

      <Accordion type="multiple" defaultValue={['category', 'price', 'brand']}>
        {/* Category */}
        <AccordionItem value="category">
          <AccordionTrigger className="text-[14px] font-semibold uppercase tracking-wider text-ap-text2">
            Category
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-1">
              {filters.categories.map(cat => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                  <Checkbox
                    checked={filters.selectedCategories.includes(cat.id)}
                    onCheckedChange={() => onChange.toggleCategory(cat.id)}
                    className="rounded"
                  />
                  <span className="text-[14px] text-ap-black dark:text-white group-hover:text-accent transition-colors">
                    {cat.name}
                  </span>
                  <span className="ml-auto text-[12px] text-ap-text3">{cat.count}</span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-[14px] font-semibold uppercase tracking-wider text-ap-text2">
            Price
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2 pb-4 px-1">
              <Slider
                min={0} max={5000} step={50}
                value={filters.priceRange}
                onValueChange={onChange.setPriceRange}
                className="[&_[role=slider]]:bg-accent [&_[role=slider]]:border-accent"
              />
              <div className="flex justify-between mt-2 text-[13px] text-ap-text2">
                <span>${filters.priceRange[0].toLocaleString()}</span>
                <span>${filters.priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* In Stock toggle */}
        <div className="flex items-center justify-between py-4 border-b border-ap-gray2 dark:border-[#2c2c2e]">
          <span className="text-[14px] font-medium text-ap-black dark:text-white">In Stock Only</span>
          <Switch
            checked={filters.inStockOnly}
            onCheckedChange={onChange.setInStockOnly}
            className="data-[state=checked]:bg-accent"
          />
        </div>
      </Accordion>
    </aside>
  )
}
```

---

## 14. CompareBar

```tsx
// components/product/CompareBar.tsx
export function CompareBar() {
  const { items, removeItem, clear } = useCompareStore()

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-xl border-t border-ap-gray2 dark:border-[#2c2c2e] shadow-xl animate-slide-up">
      <div className="mx-auto max-w-[1400px] px-6 py-4 flex items-center gap-4 overflow-x-auto">
        <span className="shrink-0 text-[14px] font-semibold text-ap-black dark:text-white">Compare:</span>

        {items.map(item => (
          <div key={item.id} className="shrink-0 flex items-center gap-2 bg-ap-gray1 dark:bg-[#2c2c2e] rounded-xl px-3 py-2">
            <Image src={item.imageUrl} alt={item.name} width={32} height={32} className="object-contain" />
            <span className="text-[13px] font-medium max-w-[120px] truncate">{item.name}</span>
            <button onClick={() => removeItem(item.id)}>
              <X className="w-3.5 h-3.5 text-ap-text3 hover:text-[#ff3b30] transition-colors" />
            </button>
          </div>
        ))}

        {items.length < 4 && (
          <div className="shrink-0 w-32 h-12 border-2 border-dashed border-ap-gray3 dark:border-[#3a3a3c] rounded-xl flex items-center justify-center text-ap-text3 text-[13px] gap-1">
            <Plus className="w-3.5 h-3.5" /> Add
          </div>
        )}

        <div className="ml-auto shrink-0 flex items-center gap-3">
          <button onClick={clear} className="text-[13px] text-ap-text2 hover:text-ap-black dark:hover:text-white">
            Clear
          </button>
          <Button size="md" asChild disabled={items.length < 2}>
            <Link href="/compare">Compare Now ({items.length})</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 15. WishlistButton

```tsx
// components/product/WishlistButton.tsx
export function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const { isInWishlist, toggle } = useWishlistStore()
  const { user } = useAuth()
  const router = useRouter()
  const inWishlist = isInWishlist(productId)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { router.push('/login'); return }
    toggle(productId)
  }

  return (
    <button
      onClick={handleClick}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      className={cn(
        'w-9 h-9 rounded-full flex items-center justify-center',
        'bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-sm',
        'border border-ap-gray2 dark:border-[#3a3a3c]',
        'shadow-sm hover:shadow-md transition-all duration-150',
        'hover:scale-110 active:scale-95',
        className
      )}
    >
      <Heart className={cn(
        'w-4 h-4 transition-colors',
        inWishlist ? 'fill-[#ff3b30] text-[#ff3b30]' : 'text-ap-text2'
      )} />
    </button>
  )
}
```

---

## 16. Header

```tsx
// components/layout/Header.tsx
'use client'

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full h-[52px] flex items-center',
      'bg-white/85 dark:bg-[#1d1d1f]/85 backdrop-blur-xl',
      'transition-shadow duration-300',
      scrolled && 'shadow-[0_1px_0_rgba(0,0,0,0.08)]'
    )}>
      <div className="mx-auto w-full max-w-[1400px] px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <ApplePlusLogo className="h-5 w-auto text-ap-black dark:text-white" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map(item => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <SearchBar />
          <WishlistIconButton />
          <CartIconButton />
          <UserMenu />
          <ThemeToggle />
          <MobileMenuButton className="lg:hidden" />
        </div>
      </div>
    </header>
  )
}
```

---

## 17. MobileNav

```tsx
// components/layout/MobileNav.tsx
// Full-screen drawer using shadcn Sheet
export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-ap-gray1 dark:hover:bg-white/10 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-[360px] p-0 bg-white dark:bg-[#1c1c1e]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-5 border-b border-ap-gray2 dark:border-[#2c2c2e]">
            <ApplePlusLogo className="h-5 text-ap-black dark:text-white" />
          </div>

          {/* Nav items */}
          <Accordion type="single" collapsible className="flex-1 overflow-y-auto px-3 py-4">
            {NAV_ITEMS.map(item => (
              item.children ? (
                <AccordionItem key={item.href} value={item.href} className="border-0">
                  <AccordionTrigger className="px-3 py-3 text-[17px] font-medium hover:bg-ap-gray1 dark:hover:bg-white/10 rounded-xl hover:no-underline">
                    {item.label}
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    {item.children.map(child => (
                      <Link key={child.href} href={child.href} onClick={() => setOpen(false)}
                        className="flex items-center px-6 py-3 text-[15px] text-ap-text2 hover:text-ap-black dark:hover:text-white"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ) : (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className="flex items-center px-3 py-3 text-[17px] font-medium hover:bg-ap-gray1 dark:hover:bg-white/10 rounded-xl"
                >
                  {item.label}
                </Link>
              )
            ))}
          </Accordion>

          {/* Footer */}
          <div className="px-6 py-5 border-t border-ap-gray2 dark:border-[#2c2c2e] space-y-3">
            <UserAuthLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

---

## 18. StatsCard (Admin)

```tsx
// components/admin/StatsCard.tsx
interface StatsCardProps {
  title: string
  value: string | number
  delta?: number      // percent change
  icon: React.ReactNode
  period?: string
}

export function StatsCard({ title, value, delta, icon, period = 'vs last month' }: StatsCardProps) {
  const isPositive = (delta ?? 0) >= 0

  return (
    <div className="rounded-2xl bg-[#1c1c1e] p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-white/50 uppercase tracking-wider">{title}</p>
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[32px] font-bold text-white tracking-tight">{value}</p>
        {delta !== undefined && (
          <div className="flex items-center gap-1.5 mt-1">
            {isPositive
              ? <TrendingUp className="w-4 h-4 text-[#32d74b]" />
              : <TrendingDown className="w-4 h-4 text-[#ff453a]" />
            }
            <span className={cn('text-[13px] font-semibold', isPositive ? 'text-[#32d74b]' : 'text-[#ff453a]')}>
              {isPositive ? '+' : ''}{delta}%
            </span>
            <span className="text-[13px] text-white/40">{period}</span>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 19. DataTable (Admin)

```tsx
// components/admin/DataTable.tsx
// Wraps shadcn Table with sorting, selection, pagination
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  flexRender, type ColumnDef
} from '@tanstack/react-table'

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  onRowClick?: (row: T) => void
}

export function DataTable<T>({ data, columns, onRowClick }: DataTableProps<T>) {
  const [sorting, setSorting] = useState([])
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data, columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="rounded-2xl border border-ap-gray2 dark:border-[#2c2c2e] overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(hg => (
            <TableRow key={hg.id} className="bg-ap-gray1 dark:bg-[#1c1c1e] hover:bg-ap-gray1 dark:hover:bg-[#1c1c1e]">
              {hg.headers.map(h => (
                <TableHead key={h.id}
                  onClick={h.column.getToggleSortingHandler()}
                  className="text-[12px] font-semibold uppercase tracking-wider text-ap-text2 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-1">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getIsSorted() === 'asc' && <ChevronUp className="w-3 h-3" />}
                    {h.column.getIsSorted() === 'desc' && <ChevronDown className="w-3 h-3" />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map(row => (
            <TableRow key={row.id}
              onClick={() => onRowClick?.(row.original)}
              className="cursor-pointer hover:bg-ap-gray1/50 dark:hover:bg-white/5 transition-colors"
            >
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id} className="text-[14px]">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

---

## 20. SkeletonCard

```tsx
// components/shared/SkeletonCard.tsx
export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-ap-gray1 dark:bg-[#1c1c1e] overflow-hidden">
      <div className="aspect-square animate-pulse bg-ap-gray2 dark:bg-[#2c2c2e]" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-ap-gray2 dark:bg-[#2c2c2e] rounded-full w-1/3 animate-pulse" />
        <div className="h-4 bg-ap-gray2 dark:bg-[#2c2c2e] rounded-full w-4/5 animate-pulse" />
        <div className="h-4 bg-ap-gray2 dark:bg-[#2c2c2e] rounded-full w-3/5 animate-pulse" />
        <div className="h-4 bg-ap-gray2 dark:bg-[#2c2c2e] rounded-full w-1/2 animate-pulse" />
      </div>
    </div>
  )
}

// Usage: render 8 skeletons while loading
export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}
```

---

## 21. EmptyState

```tsx
// components/shared/EmptyState.tsx
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-20 px-6 text-center', className)}>
      {icon && (
        <div className="mb-5 text-ap-text3">{icon}</div>
      )}
      <h3 className="text-[20px] font-semibold text-ap-black dark:text-white">{title}</h3>
      {description && (
        <p className="mt-2 text-[15px] text-ap-text2 max-w-sm">{description}</p>
      )}
      {action && (
        <div className="mt-6">{action}</div>
      )}
    </div>
  )
}
```

---

## 22. ThemeToggle

```tsx
// components/shared/ThemeToggle.tsx
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-ap-gray1 dark:hover:bg-white/10 transition-all duration-200 text-ap-text2"
    >
      <div className="relative w-4 h-4">
        <Sun className={cn('absolute inset-0 transition-all duration-300', isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100')} />
        <Moon className={cn('absolute inset-0 transition-all duration-300', isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50')} />
      </div>
    </button>
  )
}
```

---

## 23. CountdownTimer

```tsx
// components/shared/CountdownTimer.tsx
interface CountdownTimerProps {
  targetDate: Date
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate))

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  const pads = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="flex items-center gap-2">
      {[
        { label: 'hrs',  value: timeLeft.hours },
        { label: 'min',  value: timeLeft.minutes },
        { label: 'sec',  value: timeLeft.seconds },
      ].map(({ label, value }, i) => (
        <React.Fragment key={label}>
          {i > 0 && <span className="text-white/50 font-bold text-lg">:</span>}
          <div className="flex flex-col items-center">
            <span className="font-mono font-bold text-white text-[28px] w-14 text-center bg-white/10 rounded-xl py-1">
              {pads(value)}
            </span>
            <span className="text-[11px] text-white/50 mt-1 uppercase tracking-wider">{label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}
```

---

## 24. Breadcrumbs

```tsx
// components/shared/Breadcrumbs.tsx
interface BreadcrumbItem { label: string; href?: string }

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 flex-wrap">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3 h-3 text-ap-text3 shrink-0" />}
            {item.href && i < items.length - 1 ? (
              <Link href={item.href}
                className="text-[13px] text-ap-text2 hover:text-ap-black dark:hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-[13px] text-ap-black dark:text-white font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
```

---

## 25. NotificationToast

```tsx
// Uses shadcn/ui Sonner (toast library)
// lib/toast.ts
import { toast } from 'sonner'

export const notify = {
  success: (msg: string) => toast.success(msg, {
    style: { background: '#1c1c1e', color: '#f5f5f7', border: '1px solid #2c2c2e' },
    icon: <Check className="w-4 h-4 text-[#32d74b]" />,
  }),
  error: (msg: string) => toast.error(msg, {
    icon: <X className="w-4 h-4 text-[#ff453a]" />,
  }),
  cart: (name: string) => toast.custom(() => (
    <div className="flex items-center gap-3 bg-[#1c1c1e] text-white rounded-2xl px-4 py-3 shadow-xl border border-[#2c2c2e]">
      <ShoppingBag className="w-5 h-5 text-[#2997ff]" />
      <div>
        <p className="text-[14px] font-semibold">Added to Cart</p>
        <p className="text-[12px] text-white/60">{name}</p>
      </div>
      <Link href="/cart" className="ml-auto text-[13px] text-[#2997ff] hover:underline shrink-0">
        View Cart
      </Link>
    </div>
  )),
}
```

---

## Appendix: Tailwind Config Snippet

```ts
// tailwind.config.ts — complete plugin setup
import { fontFamily } from 'tailwindcss/defaultTheme'
import animatePlugin from 'tailwindcss-animate'

export default {
  darkMode: 'class',
  plugins: [animatePlugin, require('@tailwindcss/typography')],
  theme: {
    extend: {
      keyframes: {
        fadeIn:      { from: { opacity: '0' },                    to: { opacity: '1' } },
        slideUp:     { from: { transform: 'translateY(16px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideInRight:{ from: { transform: 'translateX(100%)' },   to: { transform: 'translateX(0)' } },
        scaleIn:     { from: { transform: 'scale(0.92)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        shimmer:     { '0%': { backgroundPosition: '-200% 0' },   '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
}
```

## Appendix: shadcn/ui Components to Install

```bash
npx shadcn@latest add button input label textarea select checkbox switch
npx shadcn@latest add dialog sheet drawer
npx shadcn@latest add card badge separator
npx shadcn@latest add accordion tabs
npx shadcn@latest add table
npx shadcn@latest add slider
npx shadcn@latest add avatar dropdown-menu
npx shadcn@latest add alert alert-dialog
npx shadcn@latest add progress skeleton
npx shadcn@latest add tooltip popover
npx shadcn@latest add form    # react-hook-form + zod integration
```

## Appendix: Third-Party Packages

| Package | Purpose |
|---------|---------|
| `next-themes` | Dark/light mode with SSR |
| `sonner` | Toast notifications |
| `@tanstack/react-table` | Admin DataTable |
| `zustand` | Cart, wishlist, compare stores |
| `react-hook-form` + `zod` | Form validation |
| `embla-carousel-react` | Hero carousel, product gallery |
| `@stripe/stripe-js` + `@stripe/react-stripe-js` | Payment Elements |
| `framer-motion` | Page transitions, complex animations |
| `lucide-react` | All icons |
| `clsx` + `tailwind-merge` | `cn()` utility |
