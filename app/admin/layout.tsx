import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/utils/server-auth'
import { AdminSidebar } from '@/components/ui/admin-sidebar'
import { Providers } from '@/components/providers'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    // This will throw an error if user is not authenticated or not admin
    await requireAdmin()
  } catch (error) {
    console.error('Admin access denied:', error)
    // Redirect to login if not authenticated, or dashboard if not admin
    if (error instanceof Error && error.message === 'User not authenticated') {
      redirect('/auth/login')
    } else {
      redirect('/dashboard')
    }
  }

  return (
    <Providers>
      <div className="min-h-screen bg-muted/30">
        <AdminSidebar />
        <div className="md:ml-[220px] lg:ml-[280px]">
          <main className="min-h-screen p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  )
}