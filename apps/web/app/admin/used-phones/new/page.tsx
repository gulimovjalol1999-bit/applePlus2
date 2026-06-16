'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, X } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { useBrands } from '@/hooks/useBrands'
import { useCreateUsedPhone, type UsedPhoneInput } from '@/hooks/useAdminUsedPhones'
import type { UsedPhoneConditionGrade, UsedPhoneWarrantyType, CarrierLockStatus } from '@/lib/api-types'

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  brandId: '',
  description: '',

  sku: '',
  price: '',
  purchaseCostPrice: '',

  imei: '',
  imei2: '',
  serialNumber: '',
  conditionGrade: '' as UsedPhoneConditionGrade | '',
  batteryHealthPercent: '',
  gradeNotes: '',

  warrantyType: 'none' as UsedPhoneWarrantyType,
  warrantyExpiresAt: '',
  carrierLockStatus: 'unknown' as CarrierLockStatus,
  region: '',

  includedAccessories: '',
}

const IMEI_REGEX = /^\d{15}$/

export default function NewUsedPhonePage() {
  const router = useRouter()
  const { data: categoriesData } = useCategories()
  const { data: brandsData } = useBrands()
  const createUsedPhone = useCreateUsedPhone()

  const [form, setForm] = useState(EMPTY_FORM)
  const [attributePairs, setAttributePairs] = useState<{ key: string; value: string }[]>([])
  const [defects, setDefects] = useState<{ part: string; description: string; severity: 'minor' | 'major' }[]>([])
  const [repairHistory, setRepairHistory] = useState<{ date: string; description: string }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const categories = categoriesData?.data ?? []
  const brands = brandsData?.data ?? []

  function addAttributePair() {
    setAttributePairs([...attributePairs, { key: '', value: '' }])
  }

  function updateAttributePair(index: number, field: 'key' | 'value', value: string) {
    const next = [...attributePairs]
    next[index] = { ...next[index], [field]: value }
    setAttributePairs(next)
  }

  function removeAttributePair(index: number) {
    setAttributePairs(attributePairs.filter((_, i) => i !== index))
  }

  function addDefect() {
    setDefects([...defects, { part: '', description: '', severity: 'minor' }])
  }

  function updateDefect(index: number, field: 'part' | 'description' | 'severity', value: string) {
    const next = [...defects]
    next[index] = { ...next[index], [field]: value } as typeof next[number]
    setDefects(next)
  }

  function removeDefect(index: number) {
    setDefects(defects.filter((_, i) => i !== index))
  }

  function addRepairRecord() {
    setRepairHistory([...repairHistory, { date: '', description: '' }])
  }

  function updateRepairRecord(index: number, field: 'date' | 'description', value: string) {
    const next = [...repairHistory]
    next[index] = { ...next[index], [field]: value }
    setRepairHistory(next)
  }

  function removeRepairRecord(index: number) {
    setRepairHistory(repairHistory.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (!form.categoryId) newErrors.categoryId = 'Category is required'
    if (!form.brandId) newErrors.brandId = 'Brand is required'
    if (!form.sku.trim()) newErrors.sku = 'SKU is required'
    if (!form.price || Number(form.price) <= 0) newErrors.price = 'Price must be greater than 0'
    if (!form.purchaseCostPrice || Number(form.purchaseCostPrice) <= 0) newErrors.purchaseCostPrice = 'Purchase cost must be greater than 0'
    if (!form.conditionGrade) newErrors.conditionGrade = 'Condition grade is required'
    if (form.batteryHealthPercent === '' || Number(form.batteryHealthPercent) < 0 || Number(form.batteryHealthPercent) > 100) {
      newErrors.batteryHealthPercent = 'Battery health must be between 0 and 100'
    }
    if (!IMEI_REGEX.test(form.imei)) newErrors.imei = 'IMEI must be exactly 15 digits'
    if (form.imei2 && !IMEI_REGEX.test(form.imei2)) newErrors.imei2 = 'IMEI2 must be exactly 15 digits'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Please fix the highlighted fields')
      return
    }

    setErrors({})

    const attributes: Record<string, string> = {}
    for (const { key, value } of attributePairs) {
      if (key.trim()) attributes[key.trim()] = value
    }

    const payload: UsedPhoneInput = {
      name: form.name,
      brandId: form.brandId,
      categoryId: form.categoryId,
      description: form.description || undefined,

      sku: form.sku,
      price: Number(form.price),
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,

      imei: form.imei,
      imei2: form.imei2 || undefined,
      serialNumber: form.serialNumber || undefined,
      conditionGrade: form.conditionGrade as UsedPhoneConditionGrade,
      batteryHealthPercent: Number(form.batteryHealthPercent),
      defects: defects.length > 0 ? defects : undefined,
      repairHistory: repairHistory.length > 0 ? repairHistory : undefined,
      includedAccessories: form.includedAccessories
        ? form.includedAccessories.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined,
      warrantyType: form.warrantyType,
      warrantyExpiresAt: form.warrantyType !== 'none' && form.warrantyExpiresAt ? form.warrantyExpiresAt : undefined,
      carrierLockStatus: form.carrierLockStatus,
      region: form.region || undefined,
      purchaseCostPrice: Number(form.purchaseCostPrice),
      gradeNotes: form.gradeNotes || undefined,
    }

    createUsedPhone.mutate(payload, {
      onSuccess: (created) => {
        toast.success('Used phone created')
        router.push(`/admin/used-phones/${created.id}`)
      },
      onError: (err) => toast.error(err.message),
    })
  }

  const inputClass = 'h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20'
  const selectClass = 'h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent'

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push('/admin/used-phones')}
          className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-ap-black">New Used Phone</h1>
          <p className="text-sm text-gray-400">Add a used phone listing to the catalogue</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-ap-black">Basic Info</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={300}
                className={inputClass}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Category *</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className={selectClass}
              >
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Brand *</label>
              <select
                value={form.brandId}
                onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                className={selectClass}
              >
                <option value="">Select brand…</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {errors.brandId && <p className="mt-1 text-xs text-red-500">{errors.brandId}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
              />
            </div>
          </div>
        </div>

        {/* Pricing & SKU */}
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-ap-black">Pricing & SKU</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">SKU *</label>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                maxLength={100}
                className={inputClass}
              />
              {errors.sku && <p className="mt-1 text-xs text-red-500">{errors.sku}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Price ($) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={inputClass}
              />
              {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Purchase Cost (internal) ($) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.purchaseCostPrice}
                onChange={(e) => setForm({ ...form, purchaseCostPrice: e.target.value })}
                className={inputClass}
              />
              {errors.purchaseCostPrice && <p className="mt-1 text-xs text-red-500">{errors.purchaseCostPrice}</p>}
            </div>
          </div>

          {/* Attributes */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-500">Attributes</label>
              <button type="button" onClick={addAttributePair} className="text-xs font-medium text-accent hover:underline">
                + Add attribute
              </button>
            </div>
            {attributePairs.map((pair, i) => (
              <div key={i} className="mb-2 flex items-center gap-2">
                <input
                  placeholder="key (e.g. storage)"
                  value={pair.key}
                  onChange={(e) => updateAttributePair(i, 'key', e.target.value)}
                  className="h-9 w-1/2 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
                />
                <input
                  placeholder="value (e.g. 128GB)"
                  value={pair.value}
                  onChange={(e) => updateAttributePair(i, 'value', e.target.value)}
                  className="h-9 w-1/2 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
                />
                <button type="button" onClick={() => removeAttributePair(i)} className="text-gray-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-ap-black">Condition</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Condition Grade *</label>
              <select
                value={form.conditionGrade}
                onChange={(e) => setForm({ ...form, conditionGrade: e.target.value as UsedPhoneConditionGrade })}
                className={selectClass}
              >
                <option value="">Select condition…</option>
                <option value="like_new">Like New</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="for_parts">For Parts</option>
              </select>
              {errors.conditionGrade && <p className="mt-1 text-xs text-red-500">{errors.conditionGrade}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Battery Health (%) *</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.batteryHealthPercent}
                onChange={(e) => setForm({ ...form, batteryHealthPercent: e.target.value })}
                className={inputClass}
              />
              {errors.batteryHealthPercent && <p className="mt-1 text-xs text-red-500">{errors.batteryHealthPercent}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500">Grade Notes</label>
              <textarea
                rows={3}
                value={form.gradeNotes}
                onChange={(e) => setForm({ ...form, gradeNotes: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
              />
            </div>
          </div>
        </div>

        {/* Defects */}
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ap-black">Defects</h2>
            <button type="button" onClick={addDefect} className="text-xs font-medium text-accent hover:underline">
              + Add defect
            </button>
          </div>
          {defects.map((defect, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                placeholder="Part (e.g. screen)"
                value={defect.part}
                onChange={(e) => updateDefect(i, 'part', e.target.value)}
                className="h-9 w-1/3 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
              />
              <input
                placeholder="Description"
                value={defect.description}
                onChange={(e) => updateDefect(i, 'description', e.target.value)}
                className="h-9 w-1/3 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
              />
              <select
                value={defect.severity}
                onChange={(e) => updateDefect(i, 'severity', e.target.value)}
                className="h-9 w-1/3 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
              >
                <option value="minor">Minor</option>
                <option value="major">Major</option>
              </select>
              <button type="button" onClick={() => removeDefect(i)} className="text-gray-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Repair History */}
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ap-black">Repair History</h2>
            <button type="button" onClick={addRepairRecord} className="text-xs font-medium text-accent hover:underline">
              + Add record
            </button>
          </div>
          {repairHistory.map((record, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="date"
                value={record.date}
                onChange={(e) => updateRepairRecord(i, 'date', e.target.value)}
                className="h-9 w-1/3 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
              />
              <input
                placeholder="Description"
                value={record.description}
                onChange={(e) => updateRepairRecord(i, 'description', e.target.value)}
                className="h-9 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
              />
              <button type="button" onClick={() => removeRepairRecord(i)} className="text-gray-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Identifiers */}
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-ap-black">Identifiers</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">IMEI *</label>
              <input
                value={form.imei}
                onChange={(e) => setForm({ ...form, imei: e.target.value })}
                maxLength={15}
                className={inputClass}
              />
              {errors.imei && <p className="mt-1 text-xs text-red-500">{errors.imei}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">IMEI2</label>
              <input
                value={form.imei2}
                onChange={(e) => setForm({ ...form, imei2: e.target.value })}
                maxLength={15}
                className={inputClass}
              />
              {errors.imei2 && <p className="mt-1 text-xs text-red-500">{errors.imei2}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Serial Number</label>
              <input
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                maxLength={100}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Warranty & Carrier */}
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-ap-black">Warranty & Carrier</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Warranty Type</label>
              <select
                value={form.warrantyType}
                onChange={(e) => setForm({ ...form, warrantyType: e.target.value as UsedPhoneWarrantyType })}
                className={selectClass}
              >
                <option value="none">None</option>
                <option value="seller_warranty">Seller Warranty</option>
                <option value="apple_warranty_remaining">Apple Warranty Remaining</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Warranty Expires At</label>
              <input
                type="date"
                disabled={form.warrantyType === 'none'}
                value={form.warrantyExpiresAt}
                onChange={(e) => setForm({ ...form, warrantyExpiresAt: e.target.value })}
                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Carrier Lock Status</label>
              <select
                value={form.carrierLockStatus}
                onChange={(e) => setForm({ ...form, carrierLockStatus: e.target.value as CarrierLockStatus })}
                className={selectClass}
              >
                <option value="unlocked">Unlocked</option>
                <option value="locked">Locked</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Region</label>
              <input
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                maxLength={50}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Accessories */}
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-ap-black">Accessories</h2>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Included Accessories (comma separated)</label>
            <input
              value={form.includedAccessories}
              onChange={(e) => setForm({ ...form, includedAccessories: e.target.value })}
              placeholder="charger, box, cables"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.push('/admin/used-phones')}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createUsedPhone.isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60"
          >
            {createUsedPhone.isPending ? 'Creating…' : 'Create used phone'}
          </button>
        </div>
      </form>
    </div>
  )
}
