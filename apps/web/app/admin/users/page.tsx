'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Search, ChevronLeft, ChevronRight, Loader2, Users as UsersIcon } from 'lucide-react'
import {
  useAdminUsers,
  useUpdateUserRole,
  useUpdateUserStatus,
  useDeleteUser,
} from '@/hooks/useAdminUsers'
import { useAuthStore } from '@/stores/auth'
import type { UserResponse } from '@/lib/api-types'
import { cn } from '@/lib/utils'

const ROLES = ['owner', 'manager', 'operator', 'warehouse', 'customer']

const ROLE_STYLE: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  operator: 'bg-indigo-100 text-indigo-700',
  warehouse: 'bg-orange-100 text-orange-700',
  customer: 'bg-gray-100 text-gray-600',
}

function UserRow({ user, currentUserId }: { user: UserResponse; currentUserId?: string }) {
  const updateRole = useUpdateUserRole()
  const updateStatus = useUpdateUserStatus()
  const deleteUser = useDeleteUser()
  const isSelf = user.id === currentUserId

  function handleRoleChange(role: string) {
    updateRole.mutate(
      { id: user.id, role },
      {
        onSuccess: () => toast.success('Role updated'),
        onError: (e) => toast.error(e.message),
      },
    )
  }

  function handleToggleActive() {
    updateStatus.mutate(
      { id: user.id, isActive: !user.isActive },
      {
        onSuccess: () => toast.success(user.isActive ? 'User deactivated' : 'User activated'),
        onError: (e) => toast.error(e.message),
      },
    )
  }

  function handleDelete() {
    if (!confirm(`Delete user ${user.email}?`)) return
    deleteUser.mutate(user.id, {
      onSuccess: () => toast.success('User deleted'),
      onError: (e) => toast.error(e.message),
    })
  }

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-ap-black">{user.firstName} {user.lastName}</p>
        <p className="text-[11px] text-gray-400">{user.email}</p>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{user.phone ?? '—'}</td>
      <td className="px-4 py-3">
        <select
          value={user.role}
          disabled={isSelf || updateRole.isPending}
          onChange={(e) => handleRoleChange(e.target.value)}
          className={cn(
            'rounded-full border-0 px-2.5 py-0.5 text-xs font-semibold capitalize outline-none disabled:opacity-60',
            ROLE_STYLE[user.role] ?? 'bg-gray-100 text-gray-600',
          )}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleToggleActive}
          disabled={isSelf || updateStatus.isPending}
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-semibold disabled:opacity-60',
            user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600',
          )}
        >
          {user.isActive ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={handleDelete}
          disabled={isSelf || deleteUser.isPending}
          className="text-xs font-medium text-red-500 hover:underline disabled:opacity-40"
        >
          Delete
        </button>
      </td>
    </tr>
  )
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [role, setRole] = useState('')
  const { user: currentUser } = useAuthStore()

  const { data, isLoading, isError } = useAdminUsers({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    role: role || undefined,
  })

  const users = data?.data ?? []
  const meta = data?.meta

  function handleSearchChange(val: string) {
    setSearch(val)
    clearTimeout((window as Window & { _userSearchTimer?: ReturnType<typeof setTimeout> })._userSearchTimer)
    ;(window as Window & { _userSearchTimer?: ReturnType<typeof setTimeout> })._userSearchTimer = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 350)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ap-black">Users</h1>
        <p className="text-sm text-gray-400">{meta ? `${meta.total} users` : 'Loading…'}</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search users…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 w-52"
          />
        </div>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1) }}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:border-accent"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r} className="capitalize">{r}</option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {isError ? (
          <div className="p-8 text-center text-sm text-red-500">Failed to load users.</div>
        ) : isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            <UsersIcon className="mx-auto mb-2 h-6 w-6 text-gray-300" />
            No users found.
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {['User', 'Phone', 'Role', 'Status', 'Joined', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => <UserRow key={u.id} user={u} currentUserId={currentUser?.id} />)}
            </tbody>
          </table>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>Page {meta.page} of {meta.totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={page === meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
