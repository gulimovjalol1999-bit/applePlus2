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
    // On a hard navigation, the first client render reflects the
    // pre-hydration store state (isAuthenticated: false) before the
    // persisted localStorage state is applied a moment later. Defer
    // the redirect so the re-render with the rehydrated state can
    // cancel it via the cleanup below.
    const t = setTimeout(() => {
      if (!isAuthenticated || !user) {
        router.replace('/login?redirect=/admin')
        return
      }
      if (!ADMIN_ROLES.includes(user.role)) {
        router.replace('/')
      }
    }, 100)
    return () => clearTimeout(t)
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
