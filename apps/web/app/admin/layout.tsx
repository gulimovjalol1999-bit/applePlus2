import type { Metadata } from 'next'
import { AdminGuard } from '@/components/admin/AdminGuard'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | Admin — Apple Plus' },
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex bg-gray-50">
      <AdminGuard>{children}</AdminGuard>
    </div>
  )
}
