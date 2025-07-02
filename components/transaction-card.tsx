'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteTransaction } from '@/lib/actions/transactions'
import type { Transaction } from '@/types/database'
import { toast } from 'sonner'
import { useState } from 'react'

interface TransactionCardProps {
  transaction: Transaction
  className?: string
  showActions?: boolean
}

export function TransactionCard({ transaction, className, showActions = false }: TransactionCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const isIncome = transaction.type === 'income'
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      setIsDeleting(true)
      
      try {
        const result = await deleteTransaction(transaction.slug)
        
        if (result.success) {
          toast.success('Transaction deleted successfully!', {
            description: `${transaction.title} has been removed from your records.`
          })
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
  }

  return (
    <div className={cn(
      "flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50",
      className
    )}>
      <Link 
        href={`/dashboard/transactions/${transaction.slug}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0",
          isIncome ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
        )}>
          {isIncome ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{transaction.title}</span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              • {transaction.category}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {formatDate(transaction.date)}
          </div>
        </div>
      </Link>
      
      <div className="flex items-center gap-2">
        <div className="text-right">
          <div className={cn(
            "font-semibold",
            isIncome ? "text-green-600" : "text-red-600"
          )}>
            {isIncome ? '+' : '-'}${transaction.amount.toFixed(2)}
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              asChild
            >
              <Link href={`/dashboard/transactions/${transaction.slug}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 