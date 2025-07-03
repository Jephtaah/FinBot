import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Receipt, Calendar, DollarSign } from 'lucide-react'

// Mock receipt data
const mockReceipts = [
  {
    id: '1',
    fileName: 'coffee-shop-receipt.jpg',
    uploadDate: '2024-01-15',
    amount: 15.99,
    merchant: 'Local Cafe',
    status: 'processed',
    category: 'Food'
  },
  {
    id: '2',
    fileName: 'gas-station-receipt.jpg',
    uploadDate: '2024-01-14',
    amount: 45.20,
    merchant: 'Shell',
    status: 'processed',
    category: 'Transport'
  },
  {
    id: '3',
    fileName: 'grocery-receipt.jpg',
    uploadDate: '2024-01-13',
    amount: 89.99,
    merchant: 'Supermarket',
    status: 'processing',
    category: 'Shopping'
  },
  {
    id: '4',
    fileName: 'restaurant-receipt.jpg',
    uploadDate: '2024-01-12',
    amount: 25.50,
    merchant: 'Restaurant',
    status: 'processed',
    category: 'Food'
  },
]

export default function ReceiptsPage() {
  const totalReceipts = mockReceipts.length
  const processedReceipts = mockReceipts.filter(r => r.status === 'processed').length
  const totalAmount = mockReceipts.reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
          <p className="text-muted-foreground">
            Upload and manage your receipt images
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Receipt
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
              ${totalAmount.toFixed(2)}
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
              <Button>Choose File</Button>
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
          <div className="space-y-4">
            {mockReceipts.map((receipt) => (
              <div key={receipt.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Receipt className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{receipt.fileName}</span>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(receipt.uploadDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${receipt.amount.toFixed(2)}
                      </span>
                      <span>• {receipt.merchant}</span>
                      <span>• {receipt.category}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    receipt.status === 'processed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {receipt.status === 'processed' ? 'Processed' : 'Processing...'}
                  </span>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 