import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Receipt, Calendar, DollarSign } from 'lucide-react'
import { getAllReceiptImages, getReceiptStats } from '@/lib/actions/receipt-images'
import Link from 'next/link'

export default async function ReceiptsPage() {
  // Fetch real data from the database
  const [receiptImages, receiptStats] = await Promise.all([
    getAllReceiptImages(),
    getReceiptStats()
  ])

  const { totalReceipts, processedReceipts, totalValue } = receiptStats

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
          <p className="text-muted-foreground">
            Upload and manage your receipt images
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/transactions/new">
            <Upload className="mr-2 h-4 w-4" />
            Upload Receipt
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReceipts}</div>
            <p className="text-xs text-muted-foreground">
              Uploaded this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {processedReceipts}/{totalReceipts}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From all receipts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload New Receipt</CardTitle>
          <CardDescription>
            Drag and drop or click to upload receipt images for automatic processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <Upload className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Receipt</h3>
              <p className="text-muted-foreground mb-4">
                Drop your receipt image here or click to browse
              </p>
              <Button asChild>
                <Link href="/dashboard/transactions/new">Choose File</Link>
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Supports JPG, PNG, PDF up to 10MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipts List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Receipts</CardTitle>
          <CardDescription>
            Your uploaded receipts and their processing status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {receiptImages.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No receipts uploaded yet</p>
              <p className="text-sm text-muted-foreground">
                Upload your first receipt to get started with automatic transaction processing
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {receiptImages.map((receiptImage) => {
                const transaction = receiptImage.transactions as any
                return (
                  <div key={receiptImage.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Receipt className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{receiptImage.file_name}</span>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(receiptImage.uploaded_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </span>
                          {transaction && (
                            <>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${Math.abs(transaction.amount).toFixed(2)}
                              </span>
                              <span>• {transaction.title}</span>
                              <span>• {transaction.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                        Processed
                      </span>
                                             {transaction && (
                         <Button variant="outline" size="sm" asChild>
                           <Link href={`/dashboard/transactions/${transaction.slug}`}>
                             View
                           </Link>
                         </Button>
                       )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 