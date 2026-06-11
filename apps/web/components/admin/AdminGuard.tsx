'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

const ADMIN_ROLES = ['owner', 'manager', 'operator', 'warehouse']

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/login?redirect=/admin')
      return
    }
    if (!ADMIN_ROLES.includes(user.role)) {
      router.replace('/')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || !user || !ADMIN_ROLES.includes(user.role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Checking access…</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </>
  )
}
