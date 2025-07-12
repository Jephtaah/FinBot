import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { TransactionForm } from '@/components/forms/transaction-form'
import { SmartBackButton } from '@/components/ui/smart-back-button'
import { getTransactionBySlug } from '@/lib/actions/transactions'

interface EditTransactionPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function EditTransactionPage({ params }: EditTransactionPageProps) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const transaction = await getTransactionBySlug(decodedSlug)

  if (!transaction) {
    notFound()
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col gap-6">
        <SmartBackButton 
          className="w-fit" 
          fallbackHref={`/dashboard/transactions/${decodedSlug}`}
          fallbackText={`Back to ${transaction.title}`}
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Edit Transaction</h1>
          <p className="text-muted-foreground">
            Update the details for &quot;{transaction.title}&quot;
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-6">
            <TransactionForm transaction={transaction} mode="edit" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 