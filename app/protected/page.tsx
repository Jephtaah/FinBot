import { redirect } from 'next/navigation'
import Link from 'next/link'

import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/auth/login')
  }

  // Redirect authenticated users to the new dashboard
  redirect('/dashboard')

  return (
    <div className="flex h-svh w-full items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-lg">
          Hello <span className="font-semibold">{data.user?.email}</span>
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/dashboard/account">
              Edit Profile
            </Link>
          </Button>
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
