'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { useCart } from '@/hooks/useCart'
import { useAddresses, useCreateAddress } from '@/hooks/useAddresses'
import { useValidateCoupon } from '@/hooks/useCoupons'
import { useCreateOrder } from '@/hooks/useOrders'
import { usePaymeCheckout } from '@/hooks/usePayme'
import { useAuthStore } from '@/stores/auth'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { AddressSection } from '@/components/checkout/AddressSection'
import { OrderSummary } from '@/components/checkout/OrderSummary'
import type { CreateAddressRequest, CouponValidationResponse } from '@/lib/api-types'

function getOrCreateIdempotencyKey(): string {
  const KEY = 'ap-order-idempotency-key'
  let id = sessionStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(KEY, id)
  }
  return id
}

function resetIdempotencyKey() {
  sessionStorage.removeItem('ap-order-idempotency-key')
}

export default function CheckoutPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { data: cart, isLoading: cartLoading } = useCart()
  const { data: addresses, isLoading: addressesLoading } = useAddresses()
  const createAddress = useCreateAddress()
  const validateCoupon = useValidateCoupon()
  const createOrder = useCreateOrder()
  const paymeCheckout = usePaymeCheckout()

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<(CouponValidationResponse & { code: string }) | null>(null)
  const [addressForm, setAddressForm] = useState<CreateAddressRequest>({
    label: 'Home',
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'UZ',
    isDefault: false,
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login?returnTo=/checkout')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.isDefault) ?? addresses[0]
      setSelectedAddressId(def.id)
    }
    if (addresses && addresses.length === 0) {
      setShowAddressForm(true)
    }
  }, [addresses, selectedAddressId])

  const items = cart?.items ?? []
  const subtotal = cart?.subtotal ?? 0
  const discount = appliedCoupon?.discount ?? 0
  const total = Math.max(0, subtotal - discount)

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const created = await createAddress.mutateAsync(addressForm)
      setSelectedAddressId(created.id)
      setShowAddressForm(false)
      toast.success('Address saved')
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase()
    if (!code) return
    validateCoupon.mutate(
      { code, orderAmount: subtotal },
      {
        onSuccess: (res) => {
          if (res.valid) {
            setAppliedCoupon({ ...res, code })
            toast.success(`Coupon applied: -${formatPrice(res.discount)}`)
          } else {
            setAppliedCoupon(null)
            toast.error('Coupon is not valid for this order')
          }
        },
        onError: (err) => {
          setAppliedCoupon(null)
          toast.error((err as Error).message)
        },
      },
    )
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
  }

  const handlePlaceOrder = () => {
    if (items.length === 0) return
    if (!selectedAddressId) {
      toast.error('Please select a shipping address')
      return
    }
    const idempotencyKey = getOrCreateIdempotencyKey()
    createOrder.mutate(
      {
        dto: {
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          couponCode: appliedCoupon?.code,
          shippingAddressId: selectedAddressId,
        },
        idempotencyKey,
      },
      {
        onSuccess: async (order) => {
          resetIdempotencyKey()
          // Hand off to Payme's hosted checkout to collect payment. When Payme is
          // not configured the API returns url=null, so we just confirm the order.
          try {
            const { url } = await paymeCheckout.mutateAsync(order.id)
            if (url) {
              window.location.href = url
              return
            }
            toast.success('Order placed!')
            router.push(`/orders/${order.id}`)
          } catch (err) {
            // Order exists but payment couldn't be started — send the customer to
            // the order page where they can retry.
            toast.error((err as Error).message)
            router.push(`/orders/${order.id}`)
          }
        },
        onError: (err) => {
          toast.error((err as Error).message)
        },
      },
    )
  }

  const isLoading = cartLoading || addressesLoading

  if (!isAuthenticated) return null

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
          <p className="mt-2 text-ap-text2">Add some products before checking out.</p>
        </div>
        <Link href="/products">
          <Button size="lg">Browse Products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container-ap py-10">
      <h1 className="mb-8 text-3xl font-bold text-ap-black">Checkout</h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-8">
          <AddressSection
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            onSelectAddress={setSelectedAddressId}
            showForm={showAddressForm}
            onShowForm={() => setShowAddressForm(true)}
            onHideForm={() => setShowAddressForm(false)}
            form={addressForm}
            onFormChange={setAddressForm}
            onSubmit={handleCreateAddress}
            isSaving={createAddress.isPending}
          />

          {/* Items */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-ap-black">
              <ShoppingBag className="h-5 w-5 text-accent" /> Order Items
            </h2>
            <ul className="divide-y divide-ap-gray2 rounded-2xl border border-ap-gray2">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="font-medium text-ap-black truncate">{item.productName}</p>
                    {item.variantName && item.variantName !== item.productName && (
                      <p className="text-sm text-ap-text3">{item.variantName}</p>
                    )}
                    <p className="text-sm text-ap-text2">Qty: {item.quantity}</p>
                  </div>
                  <span className="shrink-0 font-semibold text-ap-black">
                    {formatPrice(item.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div>
          <OrderSummary
            itemCount={cart?.itemCount ?? 0}
            subtotal={subtotal}
            discount={discount}
            total={total}
            appliedCoupon={appliedCoupon}
            couponCode={couponCode}
            onCouponCodeChange={setCouponCode}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
            isValidatingCoupon={validateCoupon.isPending}
            onPlaceOrder={handlePlaceOrder}
            isPlacingOrder={createOrder.isPending || paymeCheckout.isPending}
            canPlaceOrder={!!selectedAddressId}
          />
        </div>
      </div>
    </div>
  )
}
