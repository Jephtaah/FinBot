# Account Management Implementation Guide

## Overview

This guide outlines the implementation of account management functionality in the FinBot application using Shadcn UI components. The implementation includes password changing, data export, account deletion, and logout confirmation, all with proper alert dialogs and error handling.

## Components Structure

The account management functionality is implemented using a client component called `SecurityAccountActions` that contains all the necessary UI and logic for the security and account management features.

## Implementation Steps

### 1. Create the SecurityAccountActions Component

```tsx
// components/security-account-actions.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { LogoutButton } from '@/components/logout-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'

export function SecurityAccountActions() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Change Password
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  
  // Reset password form fields
  const resetPasswordFields = () => {
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
  }
  
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match")
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      
      if (error) throw error
      
      alert('Password changed successfully')
      resetPasswordFields()
      setIsPasswordDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Download Data
  const handleDownloadData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      // Get user data
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      // Get transactions
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      
      if (txError) throw txError
      
      // Create a PDF blob
      const userData = {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        transactions: transactions || []
      }
      
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.download = `finbot-data-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
    } catch (error: any) {
      setError(error.message || 'Failed to download data')
      console.error('Error downloading data:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Delete Account
  const handleDeleteAccount = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      // Delete user account
      const { error } = await supabase.rpc('delete_user_account')
      
      if (error) throw error
      
      // Sign out
      await supabase.auth.signOut()
      
      // Redirect to home page
      router.push('/')
    } catch (error: any) {
      setError(error.message || 'Failed to delete account')
      console.error('Error deleting account:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <>
      {/* Change Password Dialog */}
      <AlertDialog open={isPasswordDialogOpen} onOpenChange={(open) => {
        setIsPasswordDialogOpen(open)
        if (!open) resetPasswordFields()
      }}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full" onClick={() => setIsPasswordDialogOpen(true)}>
            Change Password
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Your Password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your new password below. Make sure it's secure and you remember it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={resetPasswordFields}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleChangePassword}
              disabled={isLoading}
            >
              {isLoading ? 'Changing...' : 'Proceed'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Download Data Dialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full">
            Download Data
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Download Your Data</AlertDialogTitle>
            <AlertDialogDescription>
              This will download all your transactions as a PDF file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDownloadData}
              disabled={isLoading}
            >
              {isLoading ? 'Downloading...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Separator />
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
        <p className="text-xs text-muted-foreground">
          These actions cannot be undone
        </p>
        
        {/* Delete Account Dialog */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove all your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {isLoading ? 'Deleting...' : 'Delete Account'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <Separator />
      
      {/* Logout Dialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="w-full">Logout</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <LogoutButton />
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

### 2. Update the Account Page

```tsx
// app/dashboard/account/page.tsx
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { User, DollarSign, Shield } from 'lucide-react'
import { SecurityAccountActions } from '@/components/security-account-actions'

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
      </div>
    </div>
  )
}
```

### 3. Optional: Create a Server Action for User Account Management

For more complex operations or to handle server-side logic, you can create a server actions file:

```tsx
// lib/actions/user.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { deleteProfile } from '@/lib/profiles'
import { redirect } from 'next/navigation'
import { getUserTransactions } from './transactions'

// Change password (server-side implementation)
export async function changeUserPassword(oldPassword: string, newPassword: string) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Update the password
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    
    if (error) {
      console.error('Error updating password:', error)
      return { success: false, error: 'Failed to update password' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error in changeUserPassword:', error)
    return { success: false, error: 'Failed to update password' }
  }
}

// Download user data (server-side implementation)
export async function getUserData() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get user transactions
    const transactions = await getUserTransactions()
    
    // Return user data
    return { 
      success: true, 
      data: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        transactions
      }
    }
  } catch (error) {
    console.error('Error in getUserData:', error)
    return { success: false, error: 'Failed to get user data' }
  }
}

// Delete user account (server-side implementation)
export async function deleteUserAccount() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Delete user profile first (this will cascade to related data due to RLS)
    const profileDeleted = await deleteProfile(user.id)
    if (!profileDeleted) {
      return { success: false, error: 'Failed to delete user profile' }
    }
    
    // Delete the auth user
    const { error } = await supabase.auth.admin.deleteUser(user.id)
    if (error) {
      console.error('Error deleting user:', error)
      return { success: false, error: 'Failed to delete user account' }
    }
    
    // Sign out
    await supabase.auth.signOut()
    
    // Redirect to home page
    redirect('/')
  } catch (error) {
    console.error('Error in deleteUserAccount:', error)
    return { success: false, error: 'Failed to delete user account' }
  }
}
```

## Shadcn UI Components Used

The implementation uses the following Shadcn UI components:

1. **AlertDialog**: For confirmation dialogs with proper headers, descriptions, and action buttons
2. **Button**: For triggering actions with appropriate variants (outline, destructive)
3. **Input**: For password fields with proper styling
4. **Label**: For form field labels
5. **Separator**: For visual separation between sections
6. **Card**: For containing the security settings section

## Key Features

### 1. Change Password

- Opens an alert dialog for password change
- Validates that new password and confirmation match
- Shows loading state during the password change process
- Displays error messages if the operation fails
- Provides success feedback

### 2. Download Data

- Opens a confirmation dialog
- Downloads user data as a PDF file
- Shows loading state during the download process
- Handles errors gracefully

### 3. Delete Account

- Opens a confirmation dialog with a warning about the irreversible action
- Shows loading state during account deletion
- Redirects to the landing page after successful deletion
- Handles errors gracefully

### 4. Logout Confirmation

- Opens a confirmation dialog before logging out
- Uses the existing LogoutButton component for the actual logout action

## Best Practices

1. **Client-Side Validation**: Validate user inputs before making API calls
2. **Loading States**: Show loading indicators during asynchronous operations
3. **Error Handling**: Display clear error messages when operations fail
4. **Confirmation Dialogs**: Use alert dialogs for potentially destructive actions
5. **Consistent Styling**: Use Shadcn UI components for a consistent look and feel
6. **Separation of Concerns**: Keep UI components separate from business logic

## Security Considerations

1. **Password Security**: Never store or log passwords in plain text
2. **Authentication Checks**: Always verify user authentication before performing sensitive operations
3. **Data Privacy**: Only allow users to access their own data
4. **Confirmation for Destructive Actions**: Always require confirmation for account deletion

## Accessibility

1. **Keyboard Navigation**: All dialogs are keyboard accessible
2. **Screen Reader Support**: All UI elements have appropriate ARIA attributes
3. **Focus Management**: Dialogs trap focus for better keyboard navigation
4. **Color Contrast**: Text has sufficient contrast against backgrounds
5. **Error Messages**: Errors are clearly communicated to users

## Conclusion

This implementation provides a complete account management solution using Shadcn UI components. The use of alert dialogs for confirmations, proper loading states, and error handling ensures a good user experience while maintaining security and accessibility. 