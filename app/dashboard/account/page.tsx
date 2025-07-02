import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogoutButton } from '@/components/logout-button'
import { Separator } from '@/components/ui/separator'
import { User, DollarSign, Bell, Shield } from 'lucide-react'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                placeholder="Enter your full name"
                defaultValue="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            <Button className="w-full">Save Changes</Button>
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
            <div className="space-y-2">
              <Label htmlFor="monthlyIncome">Monthly Income</Label>
              <Input 
                id="monthlyIncome" 
                type="number"
                placeholder="Enter your monthly income"
                defaultValue="2500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyExpenses">Expected Monthly Expenses</Label>
              <Input 
                id="monthlyExpenses" 
                type="number"
                placeholder="Enter expected monthly expenses"
                defaultValue="1500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="savingsGoal">Savings Goal</Label>
              <Input 
                id="savingsGoal" 
                type="number"
                placeholder="Enter your savings goal"
                defaultValue="1000"
              />
            </div>
            <Button className="w-full">Update Financial Info</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Manage your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Weekly Summary</div>
                <div className="text-xs text-muted-foreground">
                  Get weekly financial summaries via email
                </div>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Budget Alerts</div>
                <div className="text-xs text-muted-foreground">
                  Notifications when approaching budget limits
                </div>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Receipt Reminders</div>
                <div className="text-xs text-muted-foreground">
                  Reminders to upload receipts
                </div>
              </div>
              <input type="checkbox" className="rounded" />
            </div>
            <Button className="w-full">Save Preferences</Button>
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
            <Button variant="outline" className="w-full">
              Change Password
            </Button>
            <Button variant="outline" className="w-full">
              Download Data
            </Button>
            
            <Separator />
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
              <p className="text-xs text-muted-foreground">
                These actions cannot be undone
              </p>
              <Button variant="destructive" className="w-full">
                Delete Account
              </Button>
            </div>
            
            <Separator />
            
            <LogoutButton className="w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 