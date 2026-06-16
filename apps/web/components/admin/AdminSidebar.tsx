'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Tag,
  Award,
  BarChart3,
  LogOut,
  ChevronRight,
  Smartphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import { useLogout } from '@/hooks/useAuth'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/used-phones', label: 'Used Phones', icon: Smartphone },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/brands', label: 'Brands', icon: Award },
  { href: '/admin/users', label: 'Users', icon: Users, ownerOnly: true },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const logout = useLogout()
  const router = useRouter()

  function isActive(item: (typeof NAV)[number]) {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  async function handleLogout() {
    logout.mutate(undefined, { onSuccess: () => router.replace('/') })
  }

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-5">
        <Link href="/" className="text-lg font-bold tracking-tight text-ap-black">
          Apple<span className="text-accent">+</span>
        </Link>
        <span className="ml-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {NAV.filter((item) => !item.ownerOnly || user?.role === 'owner').map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-accent text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-ap-black',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                  {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User + logout */}
      <div className="border-t border-gray-200 p-3">
        <div className="mb-2 rounded-lg bg-gray-50 px-3 py-2">
          <p className="truncate text-xs font-semibold text-ap-black">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="truncate text-[11px] capitalize text-gray-400">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
