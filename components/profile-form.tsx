'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { Profile } from '@/types/database'

interface ProfileFormProps extends React.ComponentPropsWithoutRef<'div'> {
  userId: string
  onUpdate?: (profile: Profile) => void
}

export function ProfileForm({ className, userId, onUpdate, ...props }: ProfileFormProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [monthlyExpense, setMonthlyExpense] = useState('')
  const [savingsGoal, setSavingsGoal] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) throw error

        setProfile(data)
        setFullName(data.full_name || '')
        setAvatarUrl(data.avatar_url || '')
        setMonthlyIncome(data.monthly_income?.toString() || '')
        setMonthlyExpense(data.monthly_expense?.toString() || '')
        setSavingsGoal(data.savings_goal?.toString() || '')
      } catch (error) {
        console.error('Error loading profile:', error)
        setError('Failed to load profile data')
      } finally {
        setIsInitialLoading(false)
      }
    }

    if (userId) {
      loadProfile()
    }
  }, [userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const updates = {
        full_name: fullName || null,
        avatar_url: avatarUrl || null,
        monthly_income: monthlyIncome ? parseFloat(monthlyIncome) : null,
        monthly_expense: monthlyExpense ? parseFloat(monthlyExpense) : null,
        savings_goal: savingsGoal ? parseFloat(savingsGoal) : null,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      setSuccess('Profile updated successfully!')
      
      if (onUpdate) {
        onUpdate(data)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (isInitialLoading) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading profile...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and financial details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>
                
                <div className="grid gap-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input
                    id="full-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed here
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="avatar-url">Avatar URL</Label>
                  <Input
                    id="avatar-url"
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Financial Information</h3>
                
                <div className="grid gap-2">
                  <Label htmlFor="monthly-income">Monthly Income ($)</Label>
                  <Input
                    id="monthly-income"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="5000.00"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="monthly-expense">Monthly Expenses ($)</Label>
                  <Input
                    id="monthly-expense"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="3000.00"
                    value={monthlyExpense}
                    onChange={(e) => setMonthlyExpense(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="savings-goal">Savings Goal ($)</Label>
                  <Input
                    id="savings-goal"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="10000.00"
                    value={savingsGoal}
                    onChange={(e) => setSavingsGoal(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 text-sm text-green-500 bg-green-50 border border-green-200 rounded">
                  {success}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Profile'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 