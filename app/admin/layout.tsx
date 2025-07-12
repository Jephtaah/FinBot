import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/ui/admin-sidebar'
import { Providers } from '@/components/providers'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/auth/login')
  }

  // Check if user has admin role using the safe function
  const { data: isAdminResult } = await supabase
    .rpc('auth_user_is_admin')

  if (!isAdminResult) {
    redirect('/dashboard') // Redirect non-admin users to regular dashboard
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