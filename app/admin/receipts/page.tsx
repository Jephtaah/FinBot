import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Receipt, FileImage, HardDrive, Calendar } from 'lucide-react'

interface ReceiptData {
  id: string
  transaction_id: string
  user_id: string
  file_name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  storage_bucket: string
  uploaded_at: string
  transaction: {
    title: string
    amount: string
    type: string
    date: string
  } | null
  user: {
    email: string
    full_name: string | null
  } | null
}

async function getAllReceipts(): Promise<ReceiptData[]> {
  const supabase = await createClient()
  
  try {
    // Use simple query to avoid join issues
    const { data: simpleReceipts, error: simpleError } = await supabase
      .from('receipt_images')
      .select('*')
      .order('uploaded_at', { ascending: false })
    
    if (simpleError) {
      console.error('Error fetching receipts:', simpleError)
      return []
    }
    
    if (!simpleReceipts || simpleReceipts.length === 0) {
      return []
    }
    
    // Get additional data separately for better reliability
    const receiptsWithData = await Promise.all(
      simpleReceipts.map(async (receipt) => {
        let transaction = null
        let user = null
        
        // Get transaction data if transaction_id exists
        if (receipt.transaction_id) {
          const { data: transactionData, error: transactionError } = await supabase
            .from('transactions')
            .select('title, amount, type, date')
            .eq('id', receipt.transaction_id)
            .single()
          
          if (!transactionError) {
            transaction = transactionData
          }
        }
        
        // Get user data if user_id exists
        if (receipt.user_id) {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', receipt.user_id)
            .single()
          
          if (!userError) {
            user = userData
          }
        }
        
        return {
          ...receipt,
          transaction,
          user
        }
      })
    )
    
    return receiptsWithData
  } catch (err) {
    console.error('Error in getAllReceipts:', err)
    return []
  }
}

async function getReceiptStats() {
  const supabase = await createClient()
  
  try {
    const { count: totalReceipts, error: countError } = await supabase
      .from('receipt_images')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('Error getting receipt count:', countError)
      return {
        total: 0,
        totalSize: 0,
        recent: 0,
        images: 0,
        pdfs: 0
      }
    }
    
    const { data: sizeData } = await supabase
      .from('receipt_images')
      .select('file_size')
      .not('file_size', 'is', null)
    
    const totalSize = sizeData?.reduce((sum, r) => sum + (r.file_size || 0), 0) || 0
    
    const { count: recentReceipts } = await supabase
      .from('receipt_images')
      .select('*', { count: 'exact', head: true })
      .gte('uploaded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    
    const { data: mimeTypes } = await supabase
      .from('receipt_images')
      .select('mime_type')
      .not('mime_type', 'is', null)
    
    const imageCount = mimeTypes?.filter(r => r.mime_type?.startsWith('image/')).length || 0
    const pdfCount = mimeTypes?.filter(r => r.mime_type === 'application/pdf').length || 0
    
    return {
      total: totalReceipts || 0,
      totalSize: totalSize,
      recent: recentReceipts || 0,
      images: imageCount,
      pdfs: pdfCount
    }
  } catch (err) {
    console.error('Error in getReceiptStats:', err)
    return {
      total: 0,
      totalSize: 0,
      recent: 0,
      images: 0,
      pdfs: 0
    }
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default async function AdminReceiptsPage() {
  const [receipts, stats] = await Promise.all([
    getAllReceipts(),
    getReceiptStats()
  ])

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 md:gap-4 md:p-4 lg:gap-6 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight truncate">Receipts</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Manage and view all uploaded receipt images
          </p>
        </div>
      </div>

      {/* Receipt Stats */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-1.5 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center justify-between">
              Total Receipts
              <Receipt className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg md:text-xl lg:text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All uploaded receipts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-1.5 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center justify-between">
              Storage Used
              <HardDrive className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg md:text-xl lg:text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total storage consumed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-1.5 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center justify-between">
              File Types
              <FileImage className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs md:text-sm space-y-1">
              <div>Images: {stats.images}</div>
              <div>PDFs: {stats.pdfs}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-1.5 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center justify-between">
              Recent Uploads
              <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg md:text-xl lg:text-2xl font-bold">{stats.recent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Uploaded this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Receipts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">All Receipts</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Complete list of uploaded receipt images with transaction details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <div className="text-center py-6 md:py-8">
              <Receipt className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 mx-auto mb-3 md:mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm md:text-base text-muted-foreground">No receipts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {receipt.mime_type?.startsWith('image/') ? (
                            <FileImage className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Receipt className="h-4 w-4 text-red-500" />
                          )}
                          <span className="truncate max-w-[150px]" title={receipt.file_name}>
                            {receipt.file_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {receipt.user?.full_name || 'Not set'}
                          </div>
                          <div className="text-muted-foreground">
                            {receipt.user?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={receipt.transaction?.title}>
                          {receipt.transaction?.title}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${parseFloat(receipt.transaction?.amount || '0').toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={receipt.transaction?.type === 'income' ? 'default' : 'secondary'}>
                          {receipt.transaction?.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {receipt.file_size ? formatFileSize(receipt.file_size) : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {receipt.mime_type?.split('/')[1]?.toUpperCase() || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div>
                          <div>{new Date(receipt.uploaded_at).toLocaleDateString()}</div>
                          <div className="text-xs">
                            {new Date(receipt.uploaded_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}