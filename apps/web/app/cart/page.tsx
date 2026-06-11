'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Lock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from '@/hooks/useCart'
import { useAuthStore } from '@/stores/auth'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=200&q=80'

export default function CartPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { data: cart, isLoading } = useCart()
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()
  const clearCart = useClearCart()

  const items = cart?.items ?? []
  const subtotal = cart?.subtotal ?? 0

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login?returnTo=/checkout')
      return
    }
    router.push('/checkout')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-ap-text3" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container-ap flex flex-col items-center justify-center gap-6 py-32 text-center">
        <div className="rounded-full bg-ap-gray1 p-8">
          <ShoppingBag className="h-14 w-14 text-ap-gray3" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ap-black">Your cart is empty</h1>
          <p className="mt-2 text-ap-text2">Add some products to get started.</p>
        </div>
        <Link href="/products">
          <Button size="lg">Browse Products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container-ap py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ap-black">Shopping Cart</h1>
        <button
          onClick={() =>
            clearCart.mutate(undefined, {
              onError: (e) => toast.error((e as Error).message),
            })
          }
          disabled={clearCart.isPending}
          className="text-sm text-ap-text3 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          Clear cart
        </button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* Items */}
        <div>
          <Link
            href="/products"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Continue Shopping
          </Link>

          <ul className="divide-y divide-ap-gray2">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 py-6">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-ap-gray1">
                  <Image
                    src={item.imageUrl ?? FALLBACK_IMAGE}
                    alt={item.productName}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <p className="font-semibold text-ap-black leading-snug">{item.productName}</p>
                  {item.variantName && item.variantName !== item.productName && (
                    <p className="text-sm text-ap-text3">{item.variantName}</p>
                  )}
                  <p className="font-bold text-ap-black">{formatPrice(item.salePrice ?? item.price)}</p>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex items-center rounded-full border border-ap-gray2">
                      <button
                        onClick={() => {
                          if (item.quantity <= 1) {
                            removeItem.mutate(item.variantId, {
                              onError: (e) => toast.error((e as Error).message),
                            })
                            return
                          }
                          updateItem.mutate(
                            { variantId: item.variantId, quantity: item.quantity - 1 },
                            { onError: (e) => toast.error((e as Error).message) },
                          )
                        }}
                        disabled={updateItem.isPending || removeItem.isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ap-text2 hover:bg-ap-gray1 hover:text-ap-black transition-colors disabled:opacity-50"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateItem.mutate(
                            { variantId: item.variantId, quantity: item.quantity + 1 },
                            { onError: (e) => toast.error((e as Error).message) },
                          )
                        }
                        disabled={updateItem.isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ap-text2 hover:bg-ap-gray1 hover:text-ap-black transition-colors disabled:opacity-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-ap-black">
                      {formatPrice(item.lineTotal)}
                    </span>
                    <button
                      onClick={() =>
                        removeItem.mutate(item.variantId, {
                          onError: (e) => toast.error((e as Error).message),
                        })
                      }
                      disabled={removeItem.isPending}
                      className="ml-auto text-ap-text3 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Order summary */}
        <div>
          <div className="sticky top-20 rounded-2xl border border-ap-gray2 bg-ap-gray1 p-6">
            <h2 className="text-lg font-bold text-ap-black mb-5">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-ap-text2">
                <span>Subtotal ({cart?.itemCount ?? 0} items)</span>
                <span className="text-ap-black font-medium">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-ap-text3">
                Shipping & taxes are calculated at checkout
              </p>
              <div className="border-t border-ap-gray2 pt-3 flex justify-between">
                <span className="font-bold text-ap-black">Total</span>
                <span className="font-bold text-ap-black text-lg">{formatPrice(subtotal)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button className="w-full" size="lg" onClick={handleCheckout}>
                Proceed to Checkout
              </Button>
              <Link href="/products">
                <Button variant="outline" className="w-full" size="lg">
                  Continue Shopping
                </Button>
              </Link>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ap-text3">
              <Lock className="h-3.5 w-3.5" />
              <span>Secure SSL checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
