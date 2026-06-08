'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Lock } from 'lucide-react'
import { useCartStore, useCartTotal } from '@/stores/cart'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore()
  const total = useCartTotal()
  const shipping = total >= 50 ? 0 : 9.99
  const tax = total * 0.08875
  const grandTotal = total + shipping + tax

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
          onClick={clearCart}
          className="text-sm text-ap-text3 hover:text-red-500 transition-colors"
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
              <li key={item.cartItemId} className="flex gap-4 py-6">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-ap-gray1">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-semibold text-ap-black hover:text-accent transition-colors leading-snug"
                  >
                    {item.name}
                  </Link>
                  {(item.color || item.storage) && (
                    <p className="text-sm text-ap-text3">
                      {[item.color, item.storage].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="font-bold text-ap-black">{formatPrice(item.price)}</p>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex items-center rounded-full border border-ap-gray2">
                      <button
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ap-text2 hover:bg-ap-gray1 hover:text-ap-black transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ap-text2 hover:bg-ap-gray1 hover:text-ap-black transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-ap-black">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.cartItemId)}
                      className="ml-auto text-ap-text3 hover:text-red-500 transition-colors"
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
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="text-ap-black font-medium">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-ap-text2">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : 'text-ap-black font-medium'}>
                  {shipping === 0 ? 'Free' : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-ap-text2">
                <span>Estimated Tax</span>
                <span className="text-ap-black font-medium">{formatPrice(tax)}</span>
              </div>
              {total < 50 && (
                <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs text-accent">
                  Add {formatPrice(50 - total)} more for free shipping!
                </p>
              )}
              <div className="border-t border-ap-gray2 pt-3 flex justify-between">
                <span className="font-bold text-ap-black">Total</span>
                <span className="font-bold text-ap-black text-lg">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button className="w-full" size="lg">
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
