import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { TransactionForm } from '@/components/forms/transaction-form'

export default function NewTransactionPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
      {/* Top Navigation - Only Back Button */}
      <div className="flex items-center">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/transactions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transactions
          </Link>
        </Button>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Transaction</h1>
        <p className="text-muted-foreground">
          Create a new income or expense entry
        </p>
      </div>

      {/* Form */}
      <div className="flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-6">
            <TransactionForm mode="create" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 