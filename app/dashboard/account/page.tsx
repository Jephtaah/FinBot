import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, DollarSign, Shield } from 'lucide-react'
import { SecurityAccountActions } from '@/components/security-account-actions'
import { ProfileForm } from '@/components/profile-form'
import { FinancialForm } from '@/components/financial-form'
import { AccountActivityCard } from '@/components/ui/account-activity-card'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id || '')
    .single()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and financial preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileForm 
              defaultValue={profile?.full_name || ''}
              userEmail={user?.email || ''}
            />
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Settings
            </CardTitle>
            <CardDescription>
              Configure your financial goals and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FinancialForm 
              monthlyIncome={profile?.monthly_income}
              monthlyExpense={profile?.monthly_expense}
              savingsGoal={profile?.savings_goal}
            />
          </CardContent>
        </Card>

        {/* Security & Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Account
            </CardTitle>
            <CardDescription>
              Manage your account security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SecurityAccountActions />
          </CardContent>
        </Card>

        {/* App Highlights */}
        <AccountActivityCard />
      </div>
    </div>
  )
} 