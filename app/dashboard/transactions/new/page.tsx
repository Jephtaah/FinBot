import { Card, CardContent } from '@/components/ui/card'
import { TransactionForm } from '@/components/forms/transaction-form'
import { SmartBackButton } from '@/components/ui/smart-back-button'

export default function NewTransactionPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
      {/* Top Navigation - Smart Back Button */}
      <div className="flex items-center">
        <SmartBackButton 
          fallbackHref="/dashboard/transactions"
          fallbackText="Back to Transactions"
        />
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