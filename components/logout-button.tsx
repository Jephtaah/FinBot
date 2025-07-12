'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface LogoutButtonProps {
  className?: string
  children?: ReactNode
}

export function LogoutButton({ className, children }: LogoutButtonProps) {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <Button onClick={logout} className={cn(className)}>
      {children || 'Logout'}
    </Button>
  )
}
