'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { useBrands } from '@/hooks/useBrands'
import { useCreateProduct, type ProductInput } from '@/hooks/useAdminProducts'

const EMPTY_FORM = {
  categoryId: '',
  brandId: '',
  name: '',
  description: '',
  shortDescription: '',
  basePrice: '',
  salePrice: '',
  status: 'draft' as const,
  tags: '',
  metaTitle: '',
  metaDescription: '',
}

export default function NewProductPage() {
  const router = useRouter()
  const { data: categoriesData } = useCategories()
  const { data: brandsData } = useBrands()
  const createProduct = useCreateProduct()

  const [form, setForm] = useState(EMPTY_FORM)

  const categories = categoriesData?.data ?? []
  const brands = brandsData?.data ?? []

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.categoryId || !form.brandId) {
      toast.error('Please select a category and a brand')
      return
    }

    const payload: ProductInput = {
      categoryId: form.categoryId,
      brandId: form.brandId,
      name: form.name,
      basePrice: Number(form.basePrice),
      status: form.status,
      description: form.description || undefined,
      shortDescription: form.shortDescription || undefined,
      salePrice: form.salePrice ? Number(form.salePrice) : undefined,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      metaTitle: form.metaTitle || undefined,
      metaDescription: form.metaDescription || undefined,
    }

    createProduct.mutate(payload, {
      onSuccess: () => {
        toast.success('Product created')
        router.push('/admin/products')
      },
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push('/admin/products')}
          className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-ap-black">New Product</h1>
          <p className="text-sm text-gray-400">Add a new product to the catalogue</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Category *</label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
            >
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Brand *</label>
            <select
              required
              value={form.brandId}
              onChange={(e) => setForm({ ...form, brandId: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
            >
              <option value="">Select brand…</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Base price ($) *</label>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
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
              onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Tags (comma separated)</label>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="new, featured, sale"
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">Short description</label>
            <input
              maxLength={500}
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
            />
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

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Meta title</label>
            <input
              maxLength={160}
              value={form.metaTitle}
              onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Meta description</label>
            <input
              maxLength={320}
              value={form.metaDescription}
              onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createProduct.isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60"
          >
            {createProduct.isPending ? 'Creating…' : 'Create product'}
          </button>
        </div>
      </form>

      <p className="mt-4 text-xs text-gray-400">
        New products are created as drafts by default. Images and variants can be added via the API.
      </p>
    </div>
  )
}
