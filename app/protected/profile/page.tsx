import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile-form'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
        <ProfileForm userId={user.id} />
      </div>
    </div>
  )
} 