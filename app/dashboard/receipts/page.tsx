'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Receipt, Calendar, DollarSign, Loader2 } from 'lucide-react'
import { getRecentReceiptImages, getReceiptStats, getReceiptImageUrl, processReceiptImage } from '@/lib/actions/receipt-images'
import { useSingleImageUpload } from '@/hooks/use-single-image-upload'
import { SingleImageDropzone } from '@/components/ui/single-image-dropzone'
import { useUser } from '@/hooks/use-user'
import { useRouter } from 'next/navigation'
import { useNavigationHistory } from '@/hooks/use-navigation-history'
import { Suspense, useEffect, useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ReceiptsSkeleton } from '@/components/ui/receipts-skeleton'

interface ReceiptStats {
  totalReceipts: number
  processedReceipts: number
  totalValue: number
}

interface ReceiptImage {
  id: string
  file_name: string
  uploaded_at: string
  transactions?: {
    id: string
    slug: string
    title: string
    amount: number
    category: string
  }
}

export default function ReceiptsPage() {
  const { user } = useUser()
  const router = useRouter()
  const { setNavigationSource } = useNavigationHistory()
  const [receiptImages, setReceiptImages] = useState<ReceiptImage[]>([])
  const [receiptStats, setReceiptStats] = useState<ReceiptStats>({
    totalReceipts: 0,
    processedReceipts: 0,
    totalValue: 0
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Load receipts first for faster initial render
  useEffect(() => {
    async function loadReceipts() {
      try {
        const receipts = await getRecentReceiptImages(20)
        setReceiptImages(receipts as ReceiptImage[])
      } catch (error) {
        console.error('Error loading receipts:', error)
        toast.error('Failed to load receipts')
      } finally {
        setIsLoadingReceipts(false)
      }
    }

    loadReceipts()
  }, [])

  // Load stats separately to avoid blocking receipt display
  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await getReceiptStats()
        setReceiptStats(stats)
      } catch (error) {
        console.error('Error loading stats:', error)
        // Don't show error for stats as it's not critical
      } finally {
        setIsLoadingStats(false)
      }
    }

    loadStats()
  }, [])

  const handleUploadComplete = async (uploadedFile: { path: string }) => {
    try {
      setIsProcessing(true)
      
      const imageUrl = await getReceiptImageUrl(uploadedFile.path)
      if (!imageUrl) {
        throw new Error('Failed to get image URL')
      }

      const { success, data, error } = await processReceiptImage(imageUrl)
      if (!success || !data) {
        throw new Error(error || 'Failed to process receipt')
      }

      // Store the current receipts page as the previous path before redirecting
      setNavigationSource('/dashboard/receipts')
      
      const searchParams = new URLSearchParams({
        title: data.title || '',
        amount: data.amount?.toString() || '',
        date: data.date || new Date().toISOString().split('T')[0],
        category: data.category || '',
        receipt_path: uploadedFile.path
      })

      router.push(`/dashboard/transactions/new?${searchParams.toString()}`)
    } catch (error: unknown) {
      toast.error('Failed to process receipt', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const uploadProps = useSingleImageUpload({
    bucketName: 'receipts',
    path: user?.id || '',
    onUploadComplete: handleUploadComplete,
    onUploadError: (error) => {
      toast.error('Upload failed', {
        description: error.message
      })
    }
  })

  if (isLoadingReceipts) {
    return <ReceiptsSkeleton />
  }

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 md:gap-4 md:p-4 lg:gap-6 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight truncate">Receipts</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Upload and manage your receipt images
          </p>
        </div>
        <Button asChild className="self-start sm:self-auto text-xs md:text-sm">
          <Link href="/dashboard/transactions/new">
            <Upload className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Manual Entry</span>
            <span className="sm:hidden">Manual</span>
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-1.5 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Receipts</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoadingStats ? (
              <div className="h-6 w-12 md:h-8 md:w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-lg md:text-xl lg:text-2xl font-bold">{receiptStats.totalReceipts}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Uploaded this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-1.5 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Processed</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoadingStats ? (
              <div className="h-6 w-12 md:h-8 md:w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-lg md:text-xl lg:text-2xl font-bold text-green-600">
                {receiptStats.processedReceipts}/{receiptStats.totalReceipts}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Successfully processed
            </p>
          </CardContent>
        </Card>
        
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-1.5 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoadingStats ? (
              <div className="h-6 w-12 md:h-8 md:w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-lg md:text-xl lg:text-2xl font-bold">
                ${receiptStats.totalValue.toFixed(2)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              From all receipts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Upload New Receipt</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Drag and drop or click to upload receipt images for automatic processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm md:max-w-md mx-auto">
            <SingleImageDropzone
              {...uploadProps}
              disabled={isProcessing}
            />
            
            {isProcessing && (
              <div className="mt-3 md:mt-4 text-center text-xs md:text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                  Processing receipt with AI...
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Receipts List */}
      <Suspense fallback={<ReceiptsSkeleton />}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Recent Receipts</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Your uploaded receipts and their processing status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {receiptImages.length === 0 ? (
              <div className="text-center py-6 md:py-8">
                <Receipt className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 mx-auto mb-3 md:mb-4 text-muted-foreground opacity-50" />
                <p className="text-sm md:text-base text-muted-foreground">No receipts uploaded yet</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Upload your first receipt to get started with automatic transaction processing
                </p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {receiptImages.map((receiptImage) => {
                  const transaction = receiptImage.transactions
                  return (
                    <div key={receiptImage.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border p-3 md:p-4 gap-3 sm:gap-4">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                          <Receipt className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-medium text-sm md:text-base truncate">{receiptImage.file_name}</span>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1 flex-shrink-0">
                              <Calendar className="h-3 w-3" />
                              {new Date(receiptImage.uploaded_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              })}
                            </span>
                            {transaction && (
                              <>
                                <span className="flex items-center gap-1 flex-shrink-0">
                                  <DollarSign className="h-3 w-3" />
                                  ${Math.abs(transaction.amount).toFixed(2)}
                                </span>
                                <span className="truncate">{transaction.title}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="truncate">{transaction.category}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-2 md:gap-3 flex-shrink-0">
                        <span className="inline-flex items-center rounded-full px-2 md:px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                          Processed
                        </span>
                        {transaction && (
                          <Button variant="outline" size="sm" asChild className="text-xs">
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
      </Suspense>
    </div>
  )
}