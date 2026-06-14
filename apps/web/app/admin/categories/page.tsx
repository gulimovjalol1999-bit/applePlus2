'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Tag, Pencil, Trash2, X } from 'lucide-react'
import { useCategoriesTree } from '@/hooks/useCategories'
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type CategoryInput,
} from '@/hooks/useAdminCategories'
import type { CategoryResponse } from '@/lib/api-types'
import { cn } from '@/lib/utils'

interface FlatCategory extends CategoryResponse {
  depth: number
}

function flatten(categories: CategoryResponse[], depth = 0): FlatCategory[] {
  return categories.flatMap((c) => [
    { ...c, depth },
    ...(c.children ? flatten(c.children, depth + 1) : []),
  ])
}

const EMPTY_FORM: CategoryInput = {
  name: '',
  parentId: null,
  description: '',
  imageUrl: '',
  sortOrder: 0,
  isActive: true,
}

export default function AdminCategoriesPage() {
  const { data: tree, isLoading, isError } = useCategoriesTree()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CategoryInput>(EMPTY_FORM)

  const categories = flatten(tree ?? [])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(cat: CategoryResponse) {
    setEditing(cat.id)
    setForm({
      name: cat.name,
      parentId: cat.parentId,
      description: cat.description ?? '',
      imageUrl: cat.imageUrl ?? '',
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
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
    const payload: CategoryInput = {
      ...form,
      parentId: form.parentId || null,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
    }
    if (editing) {
      updateCategory.mutate(
        { id: editing, ...payload },
        {
          onSuccess: () => { toast.success('Category updated'); closeForm() },
          onError: (e) => toast.error(e.message),
        },
      )
    } else {
      createCategory.mutate(payload, {
        onSuccess: () => { toast.success('Category created'); closeForm() },
        onError: (e) => toast.error(e.message),
      })
    }
  }

  function handleDelete(cat: CategoryResponse) {
    if (!confirm(`Delete category "${cat.name}"?`)) return
    deleteCategory.mutate(cat.id, {
      onSuccess: () => toast.success('Category deleted'),
      onError: (e) => toast.error(e.message),
    })
  }

  const isSaving = createCategory.isPending || updateCategory.isPending

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ap-black">Categories</h1>
          <p className="text-sm text-gray-400">{categories.length ? `${categories.length} categories` : 'Loading…'}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Category
        </button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ap-black">
              {editing ? 'Edit Category' : 'New Category'}
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
              <label className="mb-1 block text-xs font-medium text-gray-500">Parent category</label>
              <select
                value={form.parentId ?? ''}
                onChange={(e) => setForm({ ...form, parentId: e.target.value || null })}
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent"
              >
                <option value="">— None (top level) —</option>
                {categories.filter((c) => c.id !== editing).map((c) => (
                  <option key={c.id} value={c.id}>{'—'.repeat(c.depth)} {c.name}</option>
                ))}
              </select>
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
              <label className="mb-1 block text-xs font-medium text-gray-500">Image URL</label>
              <input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Sort order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
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
                {isSaving ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {isError ? (
          <div className="p-8 text-center text-sm text-red-500">Failed to load categories.</div>
        ) : isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            <Tag className="mx-auto mb-2 h-6 w-6 text-gray-300" />
            No categories yet.
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {['Name', 'Slug', 'Status', 'Sort', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-ap-black" style={{ paddingLeft: `${16 + c.depth * 20}px` }}>
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{c.slug}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.sortOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-accent">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(c)} className="text-gray-400 hover:text-red-500">
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
