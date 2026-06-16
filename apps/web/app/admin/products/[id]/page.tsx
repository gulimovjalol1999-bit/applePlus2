'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Plus, Trash2, Star, Upload, X } from 'lucide-react'
import {
  useProduct,
  useUpdateProduct,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
  useCreateImage,
  useDeleteImage,
  useUploadImage,
  type ProductInput,
  type VariantInput,
} from '@/hooks/useAdminProducts'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-500',
}

const EMPTY_VARIANT_FORM = {
  sku: '',
  name: '',
  price: '',
  salePrice: '',
  weightKg: '',
  isDefault: false,
  isActive: true,
  initialQuantity: '0',
  reorderLevel: '5',
  warehouseLocation: '',
}

export default function AdminProductDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id

  const { data: product, isLoading, isError } = useProduct(id)
  const updateProduct = useUpdateProduct(id)
  const createVariant = useCreateVariant(id)
  const updateVariant = useUpdateVariant(id)
  const deleteVariant = useDeleteVariant(id)
  const createImage = useCreateImage(id)
  const deleteImage = useDeleteImage(id)
  const uploadImage = useUploadImage()

  const [basicForm, setBasicForm] = useState<{
    name: string
    basePrice: string
    salePrice: string
    description: string
    shortDescription: string
    tags: string
    metaTitle: string
    metaDescription: string
  } | null>(null)

  const [showVariantForm, setShowVariantForm] = useState(false)
  const [variantForm, setVariantForm] = useState(EMPTY_VARIANT_FORM)
  const [attributePairs, setAttributePairs] = useState<{ key: string; value: string }[]>([])

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-300" />
      </div>
    )
  }

  if (isError || !product) {
    return <div className="p-8 text-center text-sm text-red-500">Failed to load product.</div>
  }

  const form = basicForm ?? {
    name: product.name,
    basePrice: String(product.basePrice),
    salePrice: product.salePrice !== null ? String(product.salePrice) : '',
    description: product.description ?? '',
    shortDescription: product.shortDescription ?? '',
    tags: (product.tags ?? []).join(', '),
    metaTitle: product.metaTitle ?? '',
    metaDescription: product.metaDescription ?? '',
  }

  function handleStatusChange(status: string) {
    updateProduct.mutate(
      { status: status as ProductInput['status'] },
      {
        onSuccess: () => toast.success('Status updated'),
        onError: (e) => toast.error(e.message),
      },
    )
  }

  function handleBasicSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: Partial<ProductInput> = {
      name: form.name,
      basePrice: Number(form.basePrice),
      salePrice: form.salePrice ? Number(form.salePrice) : undefined,
      description: form.description || undefined,
      shortDescription: form.shortDescription || undefined,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      metaTitle: form.metaTitle || undefined,
      metaDescription: form.metaDescription || undefined,
    }
    updateProduct.mutate(payload, {
      onSuccess: () => { toast.success('Product updated'); setBasicForm(null) },
      onError: (e) => toast.error(e.message),
    })
  }

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

  function handleVariantSubmit(e: React.FormEvent) {
    e.preventDefault()
    const attributes: Record<string, string> = {}
    for (const { key, value } of attributePairs) {
      if (key.trim()) attributes[key.trim()] = value
    }
    const payload: VariantInput = {
      sku: variantForm.sku,
      name: variantForm.name,
      price: Number(variantForm.price),
      salePrice: variantForm.salePrice ? Number(variantForm.salePrice) : undefined,
      attributes: Object.keys(attributes).length ? attributes : undefined,
      weightKg: variantForm.weightKg ? Number(variantForm.weightKg) : undefined,
      isDefault: variantForm.isDefault,
      isActive: variantForm.isActive,
      initialQuantity: variantForm.initialQuantity ? Number(variantForm.initialQuantity) : undefined,
      reorderLevel: variantForm.reorderLevel ? Number(variantForm.reorderLevel) : undefined,
      warehouseLocation: variantForm.warehouseLocation || undefined,
    }
    createVariant.mutate(payload, {
      onSuccess: () => {
        toast.success('Variant added')
        setShowVariantForm(false)
        setVariantForm(EMPTY_VARIANT_FORM)
        setAttributePairs([])
      },
      onError: (e) => toast.error(e.message),
    })
  }

  function handleDeleteVariant(variantId: string, sku: string) {
    if (!confirm(`Delete variant "${sku}"?`)) return
    deleteVariant.mutate(variantId, {
      onSuccess: () => toast.success('Variant deleted'),
      onError: (e) => toast.error(e.message),
    })
  }

  function handleToggleVariantActive(variantId: string, isActive: boolean) {
    updateVariant.mutate(
      { variantId, isActive: !isActive },
      {
        onError: (e) => toast.error(e.message),
      },
    )
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { url } = await uploadImage.mutateAsync(file)
      const noImagesYet = !(product?.images?.length)
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

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/admin/products')}
          className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-ap-black">{product.name}</h1>
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', STATUS_STYLE[product.status] ?? 'bg-gray-100 text-gray-500')}>
              {product.status}
            </span>
          </div>
          <p className="text-sm text-gray-400">{product.slug}</p>
        </div>
        <select
          value={product.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={updateProduct.isPending}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:border-accent"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Basic info */}
      <form onSubmit={handleBasicSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-ap-black">Basic info</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setBasicForm({ ...form, name: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Base price ($) *</label>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.basePrice}
              onChange={(e) => setBasicForm({ ...form, basePrice: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Sale price ($)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.salePrice}
              onChange={(e) => setBasicForm({ ...form, salePrice: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Tags (comma separated)</label>
            <input
              value={form.tags}
              onChange={(e) => setBasicForm({ ...form, tags: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">Short description</label>
            <input
              maxLength={500}
              value={form.shortDescription}
              onChange={(e) => setBasicForm({ ...form, shortDescription: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setBasicForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Meta title</label>
            <input
              maxLength={160}
              value={form.metaTitle}
              onChange={(e) => setBasicForm({ ...form, metaTitle: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Meta description</label>
            <input
              maxLength={320}
              value={form.metaDescription}
              onChange={(e) => setBasicForm({ ...form, metaDescription: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateProduct.isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60"
          >
            {updateProduct.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      {/* Variants */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ap-black">Variants</h2>
          <button
            onClick={() => setShowVariantForm((s) => !s)}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add variant
          </button>
        </div>

        {showVariantForm && (
          <form onSubmit={handleVariantSubmit} className="mb-4 space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">SKU *</label>
                <input
                  required
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Name *</label>
                <input
                  required
                  value={variantForm.name}
                  onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Price ($) *</label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={variantForm.price}
                  onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Sale price ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={variantForm.salePrice}
                  onChange={(e) => setVariantForm({ ...variantForm, salePrice: e.target.value })}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Weight (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={variantForm.weightKg}
                  onChange={(e) => setVariantForm({ ...variantForm, weightKg: e.target.value })}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Warehouse location</label>
                <input
                  value={variantForm.warehouseLocation}
                  onChange={(e) => setVariantForm({ ...variantForm, warehouseLocation: e.target.value })}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Initial quantity</label>
                <input
                  type="number"
                  min="0"
                  value={variantForm.initialQuantity}
                  onChange={(e) => setVariantForm({ ...variantForm, initialQuantity: e.target.value })}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Reorder level</label>
                <input
                  type="number"
                  min="0"
                  value={variantForm.reorderLevel}
                  onChange={(e) => setVariantForm({ ...variantForm, reorderLevel: e.target.value })}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <div className="flex items-center gap-4 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={variantForm.isDefault}
                    onChange={(e) => setVariantForm({ ...variantForm, isDefault: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  Default variant
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={variantForm.isActive}
                    onChange={(e) => setVariantForm({ ...variantForm, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  Active
                </label>
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
                    placeholder="key (e.g. color)"
                    value={pair.key}
                    onChange={(e) => updateAttributePair(i, 'key', e.target.value)}
                    className="h-9 w-1/2 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
                  />
                  <input
                    placeholder="value (e.g. Black)"
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

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setShowVariantForm(false); setVariantForm(EMPTY_VARIANT_FORM); setAttributePairs([]) }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createVariant.isPending}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60"
              >
                {createVariant.isPending ? 'Adding…' : 'Add variant'}
              </button>
            </div>
          </form>
        )}

        {!product.variants?.length ? (
          <p className="py-6 text-center text-sm text-gray-400">No variants yet.</p>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {['SKU', 'Name', 'Price', 'Attributes', 'Stock', '', ''].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {product.variants.map((v) => (
                <tr key={v.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-sm text-gray-500">{v.sku}</td>
                  <td className="px-3 py-2 text-sm font-medium text-ap-black">
                    {v.name}
                    {v.isDefault && (
                      <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Default</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500">
                    {v.salePrice ? (
                      <>
                        <span className="text-accent font-semibold">${v.salePrice.toFixed(2)}</span>{' '}
                        <span className="text-xs text-gray-400 line-through">${v.price.toFixed(2)}</span>
                      </>
                    ) : (
                      `$${v.price.toFixed(2)}`
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {Object.entries(v.attributes ?? {}).map(([k, val]) => `${k}: ${val}`).join(', ') || '—'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500">
                    {v.availableQuantity ?? '—'}
                    {v.reorderLevel !== null && v.availableQuantity !== null && v.availableQuantity <= v.reorderLevel && (
                      <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">Low</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleToggleVariantActive(v.id, v.isActive)}
                      className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', v.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}
                    >
                      {v.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => handleDeleteVariant(v.id, v.sku)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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

        {!product.images?.length ? (
          <p className="py-6 text-center text-sm text-gray-400">No images yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {product.images.map((img) => (
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
    </div>
  )
}
