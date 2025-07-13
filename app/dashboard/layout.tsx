import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/ui/dashboard-sidebar'
import { Providers } from '@/components/providers'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/auth/login')
  }

  return (
    <Providers>
      <div className="min-h-screen bg-muted/30">
        <DashboardSidebar />
        <div className="md:ml-[220px] lg:ml-[280px]">
          <main className="min-h-screen pt-16 md:pt-0 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  )
} 