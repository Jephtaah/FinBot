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
import { toast } from 'sonner'

export function SecurityAccountActions() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [hasPasswordError, setHasPasswordError] = useState(false)
  
  const resetPasswordFields = () => {
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
    setHasPasswordError(false)
  }
  
  const handleChangePassword = async () => {
    if (!oldPassword) {
      setError("Please enter your current password")
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match")
      return
    }
    
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      // First verify the old password by trying to sign in
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        throw new Error("User not found")
      }
      
      // Create a temporary client to verify old password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword
      })
      
      if (signInError) {
        setHasPasswordError(true)
        throw new Error("Current password is incorrect")
      }
      
      // If old password is correct, update to new password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      
      if (updateError) throw updateError
      
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password changed successfully', {
        description: 'Your password has been updated securely.'
      })
      router.refresh()
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to change password'
      setError(errorMessage)
      toast.error('Password change failed', {
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDownloadData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      
      if (txError) throw txError
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) throw profileError
      
      // Generate PDF using jsPDF
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      
      const doc = new jsPDF()
      
      // Header
      doc.setFontSize(20)
      doc.setTextColor(40, 40, 40)
      doc.text('FinBot Transaction Report', 20, 20)
      
      // User Info
      doc.setFontSize(12)
      doc.setTextColor(80, 80, 80)
      doc.text(`Email: ${user.email}`, 20, 35)
      doc.text(`Full Name: ${profile?.full_name || 'N/A'}`, 20, 45)
      doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 20, 55)
      
      // Financial Summary
      if (profile?.monthly_income || profile?.monthly_expense || profile?.savings_goal) {
        doc.setFontSize(14)
        doc.setTextColor(40, 40, 40)
        doc.text('Financial Summary', 20, 75)
        
        let yPos = 85
        if (profile?.monthly_income) {
          doc.setFontSize(10)
          doc.text(`Monthly Income: $${profile.monthly_income.toFixed(2)}`, 20, yPos)
          yPos += 10
        }
        if (profile?.monthly_expense) {
          doc.text(`Monthly Expenses: $${profile.monthly_expense.toFixed(2)}`, 20, yPos)
          yPos += 10
        }
        if (profile?.savings_goal) {
          doc.text(`Savings Goal: $${profile.savings_goal.toFixed(2)}`, 20, yPos)
          yPos += 10
        }
      }
      
      // Transactions Table
      if (transactions && transactions.length > 0) {
        doc.setFontSize(14)
        doc.setTextColor(40, 40, 40)
        doc.text('Transaction History', 20, 120)
        
        const tableData = transactions.map(tx => {
          let description = 'N/A'
          
          // Handle notes field properly - check for TipTap editor format
          if (tx.notes) {
            if (typeof tx.notes === 'string') {
              description = tx.notes.trim() || 'N/A'
            } else if (typeof tx.notes === 'object' && tx.notes !== null) {
              // Handle TipTap editor format with content array
              const extractTextFromTipTap = (obj: any): string => {
                let text = ''
                
                if (obj.content && Array.isArray(obj.content)) {
                  for (const item of obj.content) {
                    if (item.type === 'paragraph' && item.content && Array.isArray(item.content)) {
                      for (const textNode of item.content) {
                        if (textNode.type === 'text' && textNode.text) {
                          text += textNode.text + ' '
                        }
                      }
                    }
                  }
                }
                
                return text.trim()
              }
              
              // Try to extract text from TipTap format
              const extractedText = extractTextFromTipTap(tx.notes)
              if (extractedText) {
                description = extractedText
              } else if ('content' in tx.notes && typeof tx.notes.content === 'string') {
                // Simple content property
                description = tx.notes.content.trim() || 'N/A'
              } else {
                // Last resort - try to find any text in the object
                const findTextInObject = (obj: any): string => {
                  if (typeof obj === 'string') return obj
                  if (typeof obj === 'object' && obj !== null) {
                    for (const value of Object.values(obj)) {
                      if (typeof value === 'string' && value.trim()) {
                        return value.trim()
                      } else if (typeof value === 'object') {
                        const found = findTextInObject(value)
                        if (found) return found
                      }
                    }
                  }
                  return ''
                }
                
                const foundText = findTextInObject(tx.notes)
                description = foundText || 'N/A'
              }
            }
          }
          
          // Fallback to title if no meaningful description found
          if (description === 'N/A' && tx.title) {
            description = tx.title
          }
          
          return [
            new Date(tx.date).toLocaleDateString(),
            description,
            tx.category || 'N/A',
            tx.type || 'N/A',
            `$${tx.amount.toFixed(2)}`
          ]
        })
        
        autoTable(doc, {
          head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
          body: tableData,
          startY: 130,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          bodyStyles: { textColor: 60 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 50 },
            2: { cellWidth: 25 },
            3: { cellWidth: 20 },
            4: { cellWidth: 25, halign: 'right' }
          }
        })
        
        // Summary statistics
        const totalIncome = transactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0)
        const totalExpense = transactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
        const netAmount = totalIncome - totalExpense
        
        const finalY = (doc as any).lastAutoTable.finalY + 20
        doc.setFontSize(12)
        doc.setTextColor(40, 40, 40)
        doc.text('Summary:', 20, finalY)
        doc.text(`Total Income: $${totalIncome.toFixed(2)}`, 20, finalY + 12)
        doc.text(`Total Expenses: $${totalExpense.toFixed(2)}`, 20, finalY + 24)
        doc.text(`Net Amount: $${netAmount.toFixed(2)}`, 20, finalY + 36)
        
        // Color the net amount based on positive/negative
        if (netAmount >= 0) {
          doc.setTextColor(0, 128, 0) // Green for positive
        } else {
          doc.setTextColor(255, 0, 0) // Red for negative
        }
        doc.text(`Net Amount: $${netAmount.toFixed(2)}`, 20, finalY + 36)
      } else {
        doc.setFontSize(12)
        doc.setTextColor(100, 100, 100)
        doc.text('No transactions found.', 20, 130)
      }
      
      // Save the PDF
      doc.save(`finbot-transactions-${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast.success('Data downloaded successfully', {
        description: 'Your transaction report has been downloaded as a PDF.'
      })
      
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to download data'
      setError(errorMessage)
      toast.error('Download failed', {
        description: errorMessage
      })
      console.error('Error downloading data:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDeleteAccount = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)
      
      if (deleteError) throw deleteError
      
      await supabase.auth.signOut()
      
      toast.success('Account deleted successfully', {
        description: 'Your account and all data have been permanently removed.'
      })
      
      router.push('/')
      
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete account'
      setError(errorMessage)
      toast.error('Account deletion failed', {
        description: errorMessage
      })
      console.error('Error deleting account:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <>
      <AlertDialog onOpenChange={(open) => {
        if (!open) resetPasswordFields()
      }}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full text-sm md:text-base">
            Change Password
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-[425px] mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base md:text-lg">Change Your Password</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Enter your new password below. Make sure it&apos;s secure and you remember it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 md:space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword" className="text-sm font-medium">Current Password</Label>
              <Input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value)
                  if (hasPasswordError) {
                    setHasPasswordError(false)
                    setError(null)
                  }
                }}
                placeholder="Enter current password"
                className="text-sm md:text-base"
              />
              {hasPasswordError && oldPassword && (
                <p className="text-xs text-red-500">Previous password was incorrect</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="text-sm md:text-base"
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters long
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="text-sm md:text-base"
              />
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={resetPasswordFields} className="w-full sm:w-auto text-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleChangePassword}
              disabled={
                isLoading || 
                !oldPassword || 
                !newPassword || 
                !confirmPassword ||
                newPassword.length < 6 ||
                newPassword !== confirmPassword
              }
              className="w-full sm:w-auto text-sm"
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full text-sm md:text-base">
            Download Data
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-[425px] mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base md:text-lg">Download Your Data</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will download all your transactions and financial data as a well-formatted PDF report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDownloadData}
              disabled={isLoading}
              className="w-full sm:w-auto text-sm"
            >
              {isLoading ? 'Downloading...' : 'Download'}
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
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full text-sm md:text-base">
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="sm:max-w-[425px] mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base md:text-lg">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                This action cannot be undone. This will permanently delete your account
                and remove all your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="w-full sm:w-auto text-sm">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="w-full sm:w-auto text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isLoading ? 'Deleting...' : 'Delete Account'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <Separator />
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="w-full text-sm md:text-base">Logout</Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-[425px] mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base md:text-lg">Logout</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to logout?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto text-sm">Cancel</AlertDialogCancel>
            <LogoutButton />
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}