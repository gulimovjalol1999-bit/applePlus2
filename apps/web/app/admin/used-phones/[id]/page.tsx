'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Plus, Trash2, Star, Upload, X, CheckCircle2 } from 'lucide-react'
import {
  useUsedPhone,
  useUpdateUsedPhone,
  useDeleteUsedPhone,
  useMarkUsedPhoneSold,
  type UsedPhoneInput,
} from '@/hooks/useAdminUsedPhones'
import {
  useCreateImage,
  useDeleteImage,
  useUploadImage,
} from '@/hooks/useAdminProducts'
import { useCategories } from '@/hooks/useCategories'
import { useBrands } from '@/hooks/useBrands'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-500',
}

const CONDITION_OPTIONS = [
  { value: 'like_new', label: 'Like New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'for_parts', label: 'For Parts' },
]

const WARRANTY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'seller_warranty', label: 'Seller Warranty' },
  { value: 'apple_warranty_remaining', label: 'Apple Warranty Remaining' },
]

const CARRIER_LOCK_OPTIONS = [
  { value: 'unlocked', label: 'Unlocked' },
  { value: 'locked', label: 'Locked' },
  { value: 'unknown', label: 'Unknown' },
]

const SEVERITY_OPTIONS = [
  { value: 'minor', label: 'Minor' },
  { value: 'major', label: 'Major' },
]

export default function AdminUsedPhoneDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id

  const { data: phone, isLoading, isError } = useUsedPhone(id)
  const updatePhone = useUpdateUsedPhone(id)
  const deletePhone = useDeleteUsedPhone()
  const markSold = useMarkUsedPhoneSold(id)
  const createImage = useCreateImage(id)
  const deleteImage = useDeleteImage(id)
  const uploadImage = useUploadImage()

  const { data: categoriesData } = useCategories()
  const { data: brandsData } = useBrands()

  const [basicForm, setBasicForm] = useState<{
    name: string
    categoryId: string
    brandId: string
    description: string
  } | null>(null)

  const [pricingForm, setPricingForm] = useState<{
    sku: string
    price: string
    purchaseCostPrice: string
  } | null>(null)
  const [attributePairs, setAttributePairs] = useState<{ key: string; value: string }[] | null>(null)

  const [conditionForm, setConditionForm] = useState<{
    conditionGrade: string
    batteryHealthPercent: string
    gradeNotes: string
  } | null>(null)

  const [defects, setDefects] = useState<{ part: string; description: string; severity: string }[] | null>(null)
  const [repairHistory, setRepairHistory] = useState<{ date: string; description: string }[] | null>(null)

  const [identifiersForm, setIdentifiersForm] = useState<{
    imei: string
    imei2: string
    serialNumber: string
  } | null>(null)

  const [warrantyForm, setWarrantyForm] = useState<{
    warrantyType: string
    warrantyExpiresAt: string
    carrierLockStatus: string
    region: string
  } | null>(null)

  const [accessoriesForm, setAccessoriesForm] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-300" />
      </div>
    )
  }

  if (isError || !phone) {
    return <div className="p-8 text-center text-sm text-red-500">Failed to load used phone.</div>
  }

  const isSold = !!phone.soldAt
  const readOnly = isSold

  const basic = basicForm ?? {
    name: phone.name,
    categoryId: phone.categoryId,
    brandId: phone.brandId,
    description: phone.description ?? '',
  }

  const pricing = pricingForm ?? {
    sku: phone.sku,
    price: String(phone.price),
    purchaseCostPrice: String(phone.purchaseCostPrice),
  }

  const attrPairs = attributePairs ?? Object.entries(phone.attributes ?? {}).map(([key, value]) => ({ key, value }))

  const condition = conditionForm ?? {
    conditionGrade: phone.conditionGrade,
    batteryHealthPercent: String(phone.batteryHealthPercent),
    gradeNotes: phone.gradeNotes ?? '',
  }

  const defectsList = defects ?? (phone.defects ?? []).map((d) => ({ ...d }))
  const repairList = repairHistory ?? (phone.repairHistory ?? []).map((r) => ({ ...r }))

  const identifiers = identifiersForm ?? {
    imei: phone.imei,
    imei2: phone.imei2 ?? '',
    serialNumber: phone.serialNumber ?? '',
  }

  const warranty = warrantyForm ?? {
    warrantyType: phone.warrantyType,
    warrantyExpiresAt: phone.warrantyExpiresAt ? phone.warrantyExpiresAt.slice(0, 10) : '',
    carrierLockStatus: phone.carrierLockStatus,
    region: phone.region ?? '',
  }

  const accessories = accessoriesForm ?? (phone.includedAccessories ?? []).join(', ')

  function handleBasicSubmit(e: React.FormEvent) {
    e.preventDefault()
    updatePhone.mutate(
      {
        name: basic.name,
        categoryId: basic.categoryId,
        brandId: basic.brandId,
        description: basic.description || undefined,
      },
      {
        onSuccess: () => { toast.success('Saved'); setBasicForm(null) },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  function addAttributePair() {
    setAttributePairs([...attrPairs, { key: '', value: '' }])
  }

  function updateAttributePair(index: number, field: 'key' | 'value', value: string) {
    const next = [...attrPairs]
    next[index] = { ...next[index], [field]: value }
    setAttributePairs(next)
  }

  function removeAttributePair(index: number) {
    setAttributePairs(attrPairs.filter((_, i) => i !== index))
  }

  function handlePricingSubmit(e: React.FormEvent) {
    e.preventDefault()
    const attributes: Record<string, string> = {}
    for (const { key, value } of attrPairs) {
      if (key.trim()) attributes[key.trim()] = value
    }
    updatePhone.mutate(
      {
        sku: pricing.sku,
        price: Number(pricing.price),
        purchaseCostPrice: Number(pricing.purchaseCostPrice),
        attributes: Object.keys(attributes).length ? attributes : undefined,
      },
      {
        onSuccess: () => { toast.success('Saved'); setPricingForm(null); setAttributePairs(null) },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  function handleConditionSubmit(e: React.FormEvent) {
    e.preventDefault()
    updatePhone.mutate(
      {
        conditionGrade: condition.conditionGrade as UsedPhoneInput['conditionGrade'],
        batteryHealthPercent: Number(condition.batteryHealthPercent),
        gradeNotes: condition.gradeNotes || undefined,
      },
      {
        onSuccess: () => { toast.success('Saved'); setConditionForm(null) },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  function addDefect() {
    setDefects([...defectsList, { part: '', description: '', severity: 'minor' }])
  }

  function updateDefect(index: number, field: 'part' | 'description' | 'severity', value: string) {
    const next = [...defectsList]
    next[index] = { ...next[index], [field]: value }
    setDefects(next)
  }

  function removeDefect(index: number) {
    setDefects(defectsList.filter((_, i) => i !== index))
  }

  function handleDefectsSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleaned = defectsList
      .filter((d) => d.part.trim() || d.description.trim())
      .map((d) => ({ part: d.part, description: d.description, severity: d.severity as 'minor' | 'major' }))
    updatePhone.mutate(
      { defects: cleaned },
      {
        onSuccess: () => { toast.success('Saved'); setDefects(null) },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  function addRepairEntry() {
    setRepairHistory([...repairList, { date: '', description: '' }])
  }

  function updateRepairEntry(index: number, field: 'date' | 'description', value: string) {
    const next = [...repairList]
    next[index] = { ...next[index], [field]: value }
    setRepairHistory(next)
  }

  function removeRepairEntry(index: number) {
    setRepairHistory(repairList.filter((_, i) => i !== index))
  }

  function handleRepairSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleaned = repairList.filter((r) => r.date.trim() || r.description.trim())
    updatePhone.mutate(
      { repairHistory: cleaned },
      {
        onSuccess: () => { toast.success('Saved'); setRepairHistory(null) },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  function handleIdentifiersSubmit(e: React.FormEvent) {
    e.preventDefault()
    updatePhone.mutate(
      {
        imei: identifiers.imei,
        imei2: identifiers.imei2 || undefined,
        serialNumber: identifiers.serialNumber || undefined,
      },
      {
        onSuccess: () => { toast.success('Saved'); setIdentifiersForm(null) },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  function handleWarrantySubmit(e: React.FormEvent) {
    e.preventDefault()
    updatePhone.mutate(
      {
        warrantyType: warranty.warrantyType as UsedPhoneInput['warrantyType'],
        warrantyExpiresAt: warranty.warrantyType !== 'none' && warranty.warrantyExpiresAt
          ? warranty.warrantyExpiresAt
          : undefined,
        carrierLockStatus: warranty.carrierLockStatus as UsedPhoneInput['carrierLockStatus'],
        region: warranty.region || undefined,
      },
      {
        onSuccess: () => { toast.success('Saved'); setWarrantyForm(null) },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  function handleAccessoriesSubmit(e: React.FormEvent) {
    e.preventDefault()
    const list = accessories.split(',').map((a) => a.trim()).filter(Boolean)
    updatePhone.mutate(
      { includedAccessories: list },
      {
        onSuccess: () => { toast.success('Saved'); setAccessoriesForm(null) },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  function handlePhoneStatusChange(status: string) {
    updatePhone.mutate(
      { status } as unknown as Partial<UsedPhoneInput>,
      {
        onSuccess: () => toast.success('Status updated'),
        onError: (e) => toast.error(e.message),
      },
    )
  }

  function handleMarkSold() {
    if (!window.confirm('Mark this phone as sold? Inventory will be set to 0 and the listing archived.')) return
    markSold.mutate(undefined, {
      onSuccess: () => toast.success('Marked as sold'),
      onError: (e) => toast.error(e.message),
    })
  }

  function handleDelete() {
    if (!window.confirm(`Delete listing "${phone?.name}"? This cannot be undone.`)) return
    deletePhone.mutate(id, {
      onSuccess: () => {
        toast.success('Listing deleted')
        router.push('/admin/used-phones')
      },
      onError: (e) => toast.error(e.message),
    })
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { url } = await uploadImage.mutateAsync(file)
      const noImagesYet = !(phone?.images?.length)
      await createImage.mutateAsync({ url, isPrimary: noImagesYet })
      toast.success('Image uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      e.target.value = ''
    }
  }

  function handleSetPrimary(url: string, variantId: string | null) {
    createImage.mutate(
      { url, isPrimary: true, variantId: variantId ?? undefined },
      {
        onSuccess: () => toast.success('Primary image updated'),
        onError: (e) => toast.error(e.message),
      },
    )
  }

  function handleDeleteImage(imageId: string) {
    if (!confirm('Delete this image?')) return
    deleteImage.mutate(imageId, {
      onSuccess: () => toast.success('Image deleted'),
      onError: (e) => toast.error(e.message),
    })
  }

  const margin = Number(pricing.price) - Number(pricing.purchaseCostPrice)

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/admin/used-phones')}
          className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-ap-black">{phone.name}</h1>
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', STATUS_STYLE[phone.status] ?? 'bg-gray-100 text-gray-500')}>
              {phone.status}
            </span>
          </div>
          <p className="text-sm text-gray-400">IMEI: {phone.imei}</p>
        </div>
        <select
          value={phone.status}
          onChange={(e) => handlePhoneStatusChange(e.target.value)}
          disabled={updatePhone.isPending || isSold}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:border-accent disabled:opacity-60"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Sold banner */}
      {isSold && (
        <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          Sold on {new Date(phone.soldAt as string).toLocaleString()}
        </div>
      )}

      {/* Basic info */}
      <form onSubmit={handleBasicSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-ap-black">Basic info</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">Name *</label>
            <input
              required
              disabled={readOnly}
              value={basic.name}
              onChange={(e) => setBasicForm({ ...basic, name: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Category *</label>
            <select
              required
              disabled={readOnly}
              value={basic.categoryId}
              onChange={(e) => setBasicForm({ ...basic, categoryId: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:bg-gray-50 disabled:text-gray-400"
            >
              {categoriesData?.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Brand *</label>
            <select
              required
              disabled={readOnly}
              value={basic.brandId}
              onChange={(e) => setBasicForm({ ...basic, brandId: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:bg-gray-50 disabled:text-gray-400"
            >
              {brandsData?.data?.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
            <textarea
              rows={4}
              disabled={readOnly}
              value={basic.description}
              onChange={(e) => setBasicForm({ ...basic, description: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
        </div>
        {!readOnly && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updatePhone.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60"
            >
              {updatePhone.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </form>

      {/* Pricing & SKU */}
      <form onSubmit={handlePricingSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-ap-black">Pricing & SKU</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">SKU *</label>
            <input
              required
              disabled={readOnly}
              value={pricing.sku}
              onChange={(e) => setPricingForm({ ...pricing, sku: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Price ($) *</label>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              disabled={readOnly}
              value={pricing.price}
              onChange={(e) => setPricingForm({ ...pricing, price: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Purchase cost price ($) *</label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              disabled={readOnly}
              value={pricing.purchaseCostPrice}
              onChange={(e) => setPricingForm({ ...pricing, purchaseCostPrice: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Margin</label>
            <div className={cn('h-9 flex items-center rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm font-semibold', margin >= 0 ? 'text-green-600' : 'text-red-500')}>
              {!isNaN(margin) ? `$${margin.toFixed(2)}` : '—'}
            </div>
          </div>
        </div>

        {/* Attributes */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs font-medium text-gray-500">Attributes</label>
            {!readOnly && (
              <button type="button" onClick={addAttributePair} className="text-xs font-medium text-accent hover:underline">
                + Add attribute
              </button>
            )}
          </div>
          {attrPairs.map((pair, i) => (
            <div key={i} className="mb-2 flex items-center gap-2">
              <input
                placeholder="key (e.g. color)"
                disabled={readOnly}
                value={pair.key}
                onChange={(e) => updateAttributePair(i, 'key', e.target.value)}
                className="h-9 w-1/2 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent disabled:bg-gray-50 disabled:text-gray-400"
              />
              <input
                placeholder="value (e.g. Black)"
                disabled={readOnly}
                value={pair.value}
                onChange={(e) => updateAttributePair(i, 'value', e.target.value)}
                className="h-9 w-1/2 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent disabled:bg-gray-50 disabled:text-gray-400"
              />
              {!readOnly && (
                <button type="button" onClick={() => removeAttributePair(i)} className="text-gray-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {!readOnly && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updatePhone.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60"
            >
              {updatePhone.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </form>

      {/* Condition */}
      <form onSubmit={handleConditionSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-ap-black">Condition</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Condition grade *</label>
            <select
              required
              disabled={readOnly}
              value={condition.conditionGrade}
              onChange={(e) => setConditionForm({ ...condition, conditionGrade: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:bg-gray-50 disabled:text-gray-400"
            >
              {CONDITION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Battery health (%) *</label>
            <input
              required
              type="number"
              min="0"
              max="100"
              disabled={readOnly}
              value={condition.batteryHealthPercent}
              onChange={(e) => setConditionForm({ ...condition, batteryHealthPercent: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">Grade notes</label>
            <textarea
              rows={3}
              disabled={readOnly}
              value={condition.gradeNotes}
              onChange={(e) => setConditionForm({ ...condition, gradeNotes: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
        </div>
        {!readOnly && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updatePhone.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60"
            >
              {updatePhone.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </form>

      {/* Defects */}
      <form onSubmit={handleDefectsSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ap-black">Defects</h2>
          {!readOnly && (
            <button
              type="button"
              onClick={addDefect}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add defect
            </button>
          )}
        </div>
        {!defectsList.length ? (
          <p className="py-4 text-center text-sm text-gray-400">No defects recorded.</p>
        ) : (
          <div className="space-y-3">
            {defectsList.map((d, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:grid-cols-[1fr_2fr_140px_auto]">
                <input
                  placeholder="Part (e.g. Screen)"
                  disabled={readOnly}
                  value={d.part}
                  onChange={(e) => updateDefect(i, 'part', e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent disabled:bg-gray-100 disabled:text-gray-400"
                />
                <input
                  placeholder="Description"
                  disabled={readOnly}
                  value={d.description}
                  onChange={(e) => updateDefect(i, 'description', e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent disabled:bg-gray-100 disabled:text-gray-400"
                />
                <select
                  disabled={readOnly}
                  value={d.severity}
                  onChange={(e) => updateDefect(i, 'severity', e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {SEVERITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {!readOnly && (
                  <button type="button" onClick={() => removeDefect(i)} className="flex items-center justify-center text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {!readOnly && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updatePhone.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60"
            >
              {updatePhone.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </form>

      {/* Repair History */}
      <form onSubmit={handleRepairSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ap-black">Repair history</h2>
          {!readOnly && (
            <button
              type="button"
              onClick={addRepairEntry}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add entry
            </button>
          )}
        </div>
        {!repairList.length ? (
          <p className="py-4 text-center text-sm text-gray-400">No repair history recorded.</p>
        ) : (
          <div className="space-y-3">
            {repairList.map((r, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:grid-cols-[160px_1fr_auto]">
                <input
                  type="date"
                  disabled={readOnly}
                  value={r.date}
                  onChange={(e) => updateRepairEntry(i, 'date', e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent disabled:bg-gray-100 disabled:text-gray-400"
                />
                <input
                  placeholder="Description"
                  disabled={readOnly}
                  value={r.description}
                  onChange={(e) => updateRepairEntry(i, 'description', e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent disabled:bg-gray-100 disabled:text-gray-400"
                />
                {!readOnly && (
                  <button type="button" onClick={() => removeRepairEntry(i)} className="flex items-center justify-center text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {!readOnly && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updatePhone.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60"
            >
              {updatePhone.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </form>

      {/* Identifiers */}
      <form onSubmit={handleIdentifiersSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-ap-black">Identifiers</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">IMEI *</label>
            <input
              required
              pattern="\d{15}"
              title="IMEI must be 15 digits"
              disabled={readOnly}
              value={identifiers.imei}
              onChange={(e) => setIdentifiersForm({ ...identifiers, imei: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">IMEI 2</label>
            <input
              pattern="\d{15}"
              title="IMEI 2 must be 15 digits"
              disabled={readOnly}
              value={identifiers.imei2}
              onChange={(e) => setIdentifiersForm({ ...identifiers, imei2: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Serial number</label>
            <input
              disabled={readOnly}
              value={identifiers.serialNumber}
              onChange={(e) => setIdentifiersForm({ ...identifiers, serialNumber: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
        </div>
        {!readOnly && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updatePhone.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60"
            >
              {updatePhone.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </form>

      {/* Warranty & Carrier */}
      <form onSubmit={handleWarrantySubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-ap-black">Warranty & carrier</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Warranty type</label>
            <select
              disabled={readOnly}
              value={warranty.warrantyType}
              onChange={(e) => setWarrantyForm({ ...warranty, warrantyType: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:bg-gray-50 disabled:text-gray-400"
            >
              {WARRANTY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Warranty expires</label>
            <input
              type="date"
              disabled={readOnly || warranty.warrantyType === 'none'}
              value={warranty.warrantyExpiresAt}
              onChange={(e) => setWarrantyForm({ ...warranty, warrantyExpiresAt: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Carrier lock status</label>
            <select
              disabled={readOnly}
              value={warranty.carrierLockStatus}
              onChange={(e) => setWarrantyForm({ ...warranty, carrierLockStatus: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:bg-gray-50 disabled:text-gray-400"
            >
              {CARRIER_LOCK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Region</label>
            <input
              disabled={readOnly}
              value={warranty.region}
              onChange={(e) => setWarrantyForm({ ...warranty, region: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
        </div>
        {!readOnly && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updatePhone.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60"
            >
              {updatePhone.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </form>

      {/* Accessories */}
      <form onSubmit={handleAccessoriesSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-ap-black">Included accessories</h2>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Accessories (comma separated)</label>
          <input
            disabled={readOnly}
            placeholder="e.g. Charger, Box, Original cable"
            value={accessories}
            onChange={(e) => setAccessoriesForm(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>
        {!readOnly && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updatePhone.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60"
            >
              {updatePhone.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </form>

      {/* Images */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ap-black">Images</h2>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/90 transition-colors">
            <Upload className="h-3.5 w-3.5" />
            {uploadImage.isPending || createImage.isPending ? 'Uploading…' : 'Upload image'}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploadImage.isPending || createImage.isPending} />
          </label>
        </div>

        {!phone.images?.length ? (
          <p className="py-6 text-center text-sm text-gray-400">No images yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {phone.images.map((img) => (
              <div key={img.id} className="group relative overflow-hidden rounded-xl border border-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.altText ?? ''} className="h-32 w-full object-cover" />
                {img.isPrimary && (
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-700">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> Primary
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  {!img.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(img.url, img.variantId)}
                      title="Set as primary"
                      className="rounded-full bg-white p-1.5 text-gray-600 hover:text-yellow-500"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteImage(img.id)}
                    title="Delete"
                    className="rounded-full bg-white p-1.5 text-gray-600 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sold / Delete actions */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-ap-black">Actions</h2>
        <div className="flex flex-wrap items-center gap-3">
          {!isSold && (
            <button
              onClick={handleMarkSold}
              disabled={markSold.isPending}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {markSold.isPending ? 'Marking…' : 'Mark as sold'}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deletePhone.isPending}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {deletePhone.isPending ? 'Deleting…' : 'Delete listing'}
          </button>
        </div>
      </div>
    </div>
  )
}
