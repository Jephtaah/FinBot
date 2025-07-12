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
    // First try the complex query
    const { data: receipts, error } = await supabase
      .from('receipt_images')
      .select(`
        *,
        transactions!inner (
          title,
          amount,
          type,
          date
        ),
        profiles!inner (
          email,
          full_name
        )
      `)
      .order('uploaded_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching receipts with joins:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      // Fallback: try simpler query without joins
      const { data: simpleReceipts, error: simpleError } = await supabase
        .from('receipt_images')
        .select('*')
        .order('uploaded_at', { ascending: false })
      
      if (simpleError) {
        console.error('Error fetching simple receipts:', simpleError)
        return []
      }
      
      // Get additional data separately
      const receiptsWithData = await Promise.all(
        (simpleReceipts || []).map(async (receipt) => {
          // Get transaction data
          const { data: transaction } = await supabase
            .from('transactions')
            .select('title, amount, type, date')
            .eq('id', receipt.transaction_id)
            .single()
          
          // Get user data
          const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', receipt.user_id)
            .single()
          
          return {
            ...receipt,
            transaction,
            user
          }
        })
      )
      
      return receiptsWithData
    }
    
    return receipts?.map(receipt => ({
      ...receipt,
      transaction: receipt.transactions,
      user: receipt.profiles
    })) || []
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
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
        <p className="text-muted-foreground">
          Manage and view all uploaded receipt images
        </p>
      </div>

      {/* Receipt Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All uploaded receipts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
            <p className="text-xs text-muted-foreground">
              Total storage consumed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">File Types</CardTitle>
            <FileImage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div>Images: {stats.images}</div>
              <div>PDFs: {stats.pdfs}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recent}</div>
            <p className="text-xs text-muted-foreground">
              Uploaded this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Receipts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Receipts</CardTitle>
          <CardDescription>
            Complete list of uploaded receipt images with transaction details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No receipts found</p>
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