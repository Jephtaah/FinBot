import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { ReceiptImagesDisplay } from '@/components/ui/receipt-images-display'
import { SmartBackButton } from '@/components/ui/smart-back-button'
import { Edit, Calendar, DollarSign, Tag, FileText, Image } from 'lucide-react'
import { getTransactionBySlug, debugListAllTransactions } from '@/lib/actions/transactions'
import { getReceiptImagesBySlug } from '@/lib/actions/receipt-images'
import type { JSONContent } from '@tiptap/react'

interface TransactionPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function TransactionPage({ params }: TransactionPageProps) {
  console.log('TransactionPage called with params:', params)
  
  // Debug: List all transactions first
  await debugListAllTransactions()
  
  // Decode the URL component to handle special characters
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  console.log('Original slug:', slug)
  console.log('Decoded slug:', decodedSlug)
  
  const transaction = await getTransactionBySlug(decodedSlug)

  if (!transaction) {
    console.log('Transaction not found, calling notFound()')
    notFound()
  }

  // Fetch receipt images for this transaction
  const receiptImages = await getReceiptImagesBySlug(decodedSlug)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
      {/* Top Navigation - Smart Back Button */}
      <div className="flex items-center">
        <SmartBackButton />
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{transaction.title}</h1>
          <p className="text-muted-foreground">
            Transaction details and notes
          </p>
        </div>
        <Button asChild className="sm:self-start">
          <Link href={`/dashboard/transactions/${transaction.slug}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Transaction
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Transaction Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Amount Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className={`text-3xl font-bold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </div>
                <Badge variant={transaction.type === 'income' ? 'default' : 'expense'}>
                  {transaction.type === 'income' ? 'Income' : 'Expense'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notes
              </CardTitle>
              <CardDescription>
                Additional details about this transaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transaction.notes && Object.keys(transaction.notes).length > 0 ? (
                <RichTextEditor
                  content={transaction.notes as JSONContent}
                  editable={false}
                  className="border-none p-0"
                />
              ) : (
                <p className="text-muted-foreground italic">No notes added</p>
              )}
            </CardContent>
          </Card>

          {/* Receipt Images Card */}
          {receiptImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Receipt Images
                </CardTitle>
                <CardDescription>
                  Attached receipt images and documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReceiptImagesDisplay images={receiptImages} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar with metadata */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(transaction.date)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <p className="text-sm text-muted-foreground">{transaction.category}</p>
                </div>
              </div>

              {receiptImages.length > 0 && (
                <div className="flex items-center gap-3">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Receipt Images</p>
                    <p className="text-sm text-muted-foreground">
                      {receiptImages.length} file{receiptImages.length > 1 ? 's' : ''} attached
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(transaction.created_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(transaction.updated_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Source</p>
                <Badge variant="outline">{transaction.source}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 