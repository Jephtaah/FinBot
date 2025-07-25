'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Edit, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
} from "@/components/ui/alert-dialog"
import { deleteTransaction } from '@/lib/actions/transactions'
import type { Transaction } from '@/types/database'
import { toast } from 'sonner'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useNavigationHistory } from '@/hooks/use-navigation-history'
import { useRouter } from 'next/navigation'

interface TransactionCardProps {
  transaction: Transaction
  className?: string
  showActions?: boolean
  clickable?: boolean
}

export function TransactionCard({ transaction, className, showActions = false, clickable = true }: TransactionCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const isIncome = transaction.type === 'income'
  const pathname = usePathname()
  const router = useRouter()
  const { setNavigationSource } = useNavigationHistory()
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleTransactionClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on action buttons
    if ((e.target as HTMLElement).closest('.action-buttons')) {
      e.preventDefault()
      return
    }
    
    // Store the current page as the source when clicking on a transaction
    setNavigationSource(pathname)
    
    if (clickable) {
      router.push(`/dashboard/transactions/${transaction.slug}`)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const result = await deleteTransaction(transaction.slug)
      
      if (result.success) {
        toast.success('Transaction deleted successfully!', {
          description: `${transaction.title} has been removed from your records.`
        })
        setIsOpen(false)
      } else {
        toast.error('Failed to delete transaction', {
          description: result.error || 'Something went wrong. Please try again.'
        })
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('An unexpected error occurred', {
        description: 'Please try again later.'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Render action buttons separately to avoid nesting <a> tags
  const actionButtons = showActions && (
    <div className="flex items-center gap-0.5 md:gap-1 ml-1 md:ml-2 action-buttons" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 md:h-8 md:w-8 p-0"
        onClick={(e) => {
          e.stopPropagation()
          router.push(`/dashboard/transactions/${transaction.slug}/edit`)
        }}
      >
        <Edit className="h-3 w-3 md:h-4 md:w-4" />
      </Button>
      
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 md:h-8 md:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={isDeleting}
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-[425px] mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base md:text-lg">Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete &quot;{transaction.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={isDeleting} className="w-full sm:w-auto text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full sm:w-auto text-sm bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Transaction'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )

  const cardContent = (
    <div 
      className={cn(
        "flex items-center justify-between p-3 md:p-4 rounded-lg border",
        clickable && "hover:bg-muted/50 transition-colors cursor-pointer",
        className
      )}
      onClick={handleTransactionClick}
    >
      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
        <div className={cn(
          "flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full flex-shrink-0",
          isIncome ? "bg-green-100" : "bg-red-100"
        )}>
          {isIncome ? (
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm md:text-base truncate">{transaction.title}</div>
          <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground">
            <span className="truncate">{formatDate(transaction.date)}</span>
            <span className="hidden sm:inline">•</span>
            <span className="capitalize truncate hidden sm:inline">{transaction.category}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        <div className="text-right">
          <div className={cn(
            "font-semibold text-sm md:text-base",
            isIncome ? "text-green-600" : "text-red-600"
          )}>
            {isIncome ? '+' : '-'}${transaction.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
        </div>
        
        {actionButtons}
      </div>
    </div>
  )

  return cardContent
} 