'use client'
import Image from 'next/image'
import Link from 'next/link'
import { X, Minus, Plus, ShoppingBag, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCartUIStore } from '@/stores/cart'
import { useCart, useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=200&q=80'

export function CartDrawer() {
  const { isOpen, closeCart } = useCartUIStore()
  const { data: cart, isLoading } = useCart()
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()

  const items = cart?.items ?? []

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ap-gray2 px-6 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-ap-black" />
            <h2 className="text-lg font-semibold text-ap-black">
              My Cart{items.length > 0 && ` (${items.length})`}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="rounded-full p-2 text-ap-text2 hover:bg-ap-gray1 hover:text-ap-black transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-ap-text3" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center py-20">
              <div className="rounded-full bg-ap-gray1 p-6">
                <ShoppingBag className="h-10 w-10 text-ap-gray3" />
              </div>
              <div>
                <p className="font-semibold text-ap-black">Your cart is empty</p>
                <p className="mt-1 text-sm text-ap-text2">Add items to get started</p>
              </div>
              <Button variant="outline" onClick={closeCart}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-6">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ap-gray1">
                    <Image
                      src={item.imageUrl ?? FALLBACK_IMAGE}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1 min-w-0">
                    <p className="text-sm font-medium text-ap-black line-clamp-2 leading-snug">
                      {item.productName}
                    </p>
                    {item.variantName && item.variantName !== item.productName && (
                      <p className="text-xs text-ap-text3">{item.variantName}</p>
                    )}
                    <p className="text-sm font-semibold text-ap-black">
                      {formatPrice(item.salePrice ?? item.price)}
                    </p>
                    <div className="mt-1 flex items-center gap-3">
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
                          className="flex h-7 w-7 items-center justify-center rounded-full text-ap-text2 hover:bg-ap-gray1 hover:text-ap-black transition-colors disabled:opacity-50"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateItem.mutate(
                              { variantId: item.variantId, quantity: item.quantity + 1 },
                              { onError: (e) => toast.error((e as Error).message) },
                            )
                          }
                          disabled={updateItem.isPending}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-ap-text2 hover:bg-ap-gray1 hover:text-ap-black transition-colors disabled:opacity-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() =>
                          removeItem.mutate(item.variantId, {
                            onError: (e) => toast.error((e as Error).message),
                          })
                        }
                        disabled={removeItem.isPending}
                        className="text-xs text-ap-text3 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-ap-gray2 px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ap-text2">Subtotal</span>
              <span className="font-semibold text-ap-black">{formatPrice(cart?.subtotal ?? 0)}</span>
            </div>
            <p className="text-xs text-ap-text3 text-center">
              Shipping & taxes calculated at checkout
            </p>
            <Link href="/cart" onClick={closeCart}>
              <Button className="w-full" size="lg">
                View Cart · {formatPrice(cart?.subtotal ?? 0)}
              </Button>
            </Link>
            <button
              onClick={closeCart}
              className="w-full text-center text-sm text-accent hover:underline"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  )
}
