'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Award, Pencil, Trash2, X } from 'lucide-react'
import {
  useAdminBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
  type BrandInput,
} from '@/hooks/useAdminBrands'
import type { BrandResponse } from '@/lib/api-types'
import { cn } from '@/lib/utils'

const EMPTY_FORM: BrandInput = {
  name: '',
  description: '',
  logoUrl: '',
  websiteUrl: '',
  isActive: true,
}

export default function AdminBrandsPage() {
  const { data, isLoading, isError } = useAdminBrands()
  const createBrand = useCreateBrand()
  const updateBrand = useUpdateBrand()
  const deleteBrand = useDeleteBrand()

  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<BrandInput>(EMPTY_FORM)

  const brands = data?.data ?? []

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(brand: BrandResponse) {
    setEditing(brand.id)
    setForm({
      name: brand.name,
      description: brand.description ?? '',
      logoUrl: brand.logoUrl ?? '',
      websiteUrl: brand.websiteUrl ?? '',
      isActive: brand.isActive,
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: BrandInput = {
      ...form,
      description: form.description || undefined,
      logoUrl: form.logoUrl || undefined,
      websiteUrl: form.websiteUrl || undefined,
    }
    if (editing) {
      updateBrand.mutate(
        { id: editing, ...payload },
        {
          onSuccess: () => { toast.success('Brand updated'); closeForm() },
          onError: (e) => toast.error(e.message),
        },
      )
    } else {
      createBrand.mutate(payload, {
        onSuccess: () => { toast.success('Brand created'); closeForm() },
        onError: (e) => toast.error(e.message),
      })
    }
  }

  function handleDelete(brand: BrandResponse) {
    if (!confirm(`Delete brand "${brand.name}"?`)) return
    deleteBrand.mutate(brand.id, {
      onSuccess: () => toast.success('Brand deleted'),
      onError: (e) => toast.error(e.message),
    })
  }

  const isSaving = createBrand.isPending || updateBrand.isPending

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ap-black">Brands</h1>
          <p className="text-sm text-gray-400">{brands.length ? `${brands.length} brands` : 'Loading…'}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Brand
        </button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ap-black">
              {editing ? 'Edit Brand' : 'New Brand'}
            </h2>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Website URL</label>
              <input
                value={form.websiteUrl}
                onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                placeholder="https://example.com"
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Logo URL</label>
              <input
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
              />
              <label htmlFor="isActive" className="text-sm text-gray-600">Active</label>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-60"
              >
                {isSaving ? 'Saving…' : editing ? 'Save changes' : 'Create brand'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {isError ? (
          <div className="p-8 text-center text-sm text-red-500">Failed to load brands.</div>
        ) : isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : brands.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            <Award className="mx-auto mb-2 h-6 w-6 text-gray-300" />
            No brands yet.
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {['Name', 'Slug', 'Website', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-ap-black">{b.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{b.slug}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {b.websiteUrl ? (
                      <a href={b.websiteUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                        {b.websiteUrl.replace(/^https?:\/\//, '')}
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {b.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(b)} className="text-gray-400 hover:text-accent">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(b)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
