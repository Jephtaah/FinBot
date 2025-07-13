'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile } from '@/lib/actions/profile'
import { toast } from 'sonner'

interface ProfileFormProps {
  defaultValue: string
  userEmail: string
}

export function ProfileForm({ defaultValue, userEmail }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [fullName, setFullName] = useState(defaultValue)
  const [isChanged, setIsChanged] = useState(false)

  useEffect(() => {
    setIsChanged(fullName !== defaultValue)
  }, [fullName, defaultValue])

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    
    try {
      const result = await updateProfile(formData)
      
      if (result.success) {
        toast.success('Profile updated successfully', {
          description: 'Your profile information has been saved.'
        })
        setIsChanged(false)
      } else {
        toast.error('Failed to update profile', {
          description: result.error || 'Please try again.'
        })
      }
    } catch {
      toast.error('Failed to update profile', {
        description: 'An unexpected error occurred. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-3 md:space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
        <Input 
          id="fullName" 
          name="fullName"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={isLoading}
          className="text-sm md:text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
        <Input 
          id="email" 
          type="email" 
          value={userEmail}
          disabled
          className="bg-muted text-sm md:text-base"
        />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed
        </p>
      </div>
      <Button 
        type="submit" 
        className="w-full text-sm md:text-base" 
        disabled={isLoading || !isChanged}
      >
        {isLoading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}