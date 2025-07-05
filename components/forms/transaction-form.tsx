'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { SingleImageDropzone } from '@/components/ui/single-image-dropzone'
import { ReceiptImagesDisplay } from '@/components/ui/receipt-images-display'
import { useSingleImageUpload } from '@/hooks/use-single-image-upload'
import { useUser } from '@/hooks/use-user'
import { useNavigationHistory } from '@/hooks/use-navigation-history'
import { createTransaction, updateTransaction } from '@/lib/actions/transactions'
import { saveReceiptImage, getReceiptImages } from '@/lib/actions/receipt-images'
import { createTransactionSchema, updateTransactionSchema, type CreateTransactionData, type UpdateTransactionData } from '@/lib/validations/transaction'
import type { Transaction } from '@/types'
import type { Database } from '@/types/database'
import { toast } from 'sonner'
import { CheckCircle, X } from 'lucide-react'

interface TransactionFormProps {
  transaction?: Transaction
  mode: 'create' | 'edit'
}

// Define an interface for the uploaded file
interface UploadedFile {
  name: string;
  path: string;
  url?: string;
  size: number;
  type: string;
}

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Groceries',
  'Gas & Fuel',
  'Home & Garden',
  'Personal Care',
  'Gifts & Donations',
  'Business',
  'Investment',
  'Other'
]

const TRANSACTION_TYPES = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' }
]

export function TransactionForm({ transaction, mode }: TransactionFormProps) {
  const router = useRouter()
  const { goBack, getBackButtonText } = useNavigationHistory()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingImages, setExistingImages] = useState<Database['public']['Tables']['receipt_images']['Row'][]>([])
  const [loadingImages, setLoadingImages] = useState(false)
  const [pendingUpload, setPendingUpload] = useState<UploadedFile | null>(null)
  const { user } = useUser()

  const schema = mode === 'create' ? createTransactionSchema : updateTransactionSchema
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTransactionData | UpdateTransactionData>({
    resolver: zodResolver(schema),
    defaultValues: transaction ? {
      title: transaction.title,
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date,
      notes: transaction.notes || {},
    } : {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      notes: {},
    }
  })

  const watchedType = watch('type')
  const watchedNotes = watch('notes')
  const watchedDate = watch('date')

  // Load existing receipt images for edit mode
  useEffect(() => {
    if (mode === 'edit' && transaction) {
      const loadExistingImages = async () => {
        setLoadingImages(true)
        try {
          const images = await getReceiptImages(transaction.id)
          setExistingImages(images)
        } catch (error) {
          console.error('Error loading existing images:', error)
        } finally {
          setLoadingImages(false)
        }
      }
      
      loadExistingImages()
    }
  }, [mode, transaction])

  // Parse URL parameters for receipt processing data
  useEffect(() => {
    if (mode === 'create' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      
      if (params.has('title')) {
        setValue('title', params.get('title') || '')
        setValue('amount', Number(params.get('amount')) || 0)
        setValue('date', params.get('date') || new Date().toISOString().split('T')[0])
        setValue('category', params.get('category') || '')
        setValue('type', 'expense') // Most receipts are expenses
        
        // If receipt path is provided, set it as pending upload
        const receiptPath = params.get('receipt_path')
        if (receiptPath) {
          // Create a mock uploaded file object to show in dropzone
          const mockFile = {
            name: receiptPath.split('/').pop() || 'receipt.jpg',
            path: receiptPath,
            url: '', // Will be populated by getReceiptImageUrl
            size: 0,
            type: 'image/jpeg'
          }
          setPendingUpload(mockFile)
        }
      }
    }
  }, [mode, setValue])

  const handleImageDeleted = () => {
    // Refresh the images list when an image is deleted
    if (mode === 'edit' && transaction) {
      const loadExistingImages = async () => {
        try {
          const images = await getReceiptImages(transaction.id)
          setExistingImages(images)
        } catch (error) {
          console.error('Error reloading images:', error)
        }
      }
      
      loadExistingImages()
    }
  }

  // Initialize single image dropzone for receipt uploads
  const imageUploadProps = useSingleImageUpload({
    bucketName: 'receipts',
    path: user?.id || '',
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    disabled: existingImages.length > 0 || !!pendingUpload, // Disable if there are existing images or pending upload
    onUploadComplete: async (uploadedFile) => {
      console.log('File uploaded:', uploadedFile)
      setPendingUpload(uploadedFile)
      toast.success('Image uploaded successfully!', {
        description: 'Image will be attached when you save the transaction.'
      })
    },
    onUploadError: (error) => {
      toast.error('Upload failed', {
        description: error.message
      })
    },
    onFileSelected: (file) => {
      // Clear pending upload when file is removed
      if (!file) {
        setPendingUpload(null)
      }
    }
  })

  const onSubmit = async (data: CreateTransactionData | UpdateTransactionData) => {
    setIsSubmitting(true)
    
    try {
      let result
      
      if (mode === 'create') {
        result = await createTransaction(data as CreateTransactionData)
        
        if (result.success && result.data) {
          // Save receipt image metadata if a file was uploaded
          if (pendingUpload) {
            await saveReceiptImage(result.data.id, {
              file_name: pendingUpload.name,
              file_path: pendingUpload.path,
              file_size: pendingUpload.size,
              mime_type: pendingUpload.type,
              storage_bucket: 'receipts'
            })
          }
          
          toast.success('Transaction created successfully!', {
            description: `${data.type === 'income' ? 'Income' : 'Expense'} of $${data.amount} has been added.`
          })
          
          // Always redirect to the transaction detail page
          router.push(`/dashboard/transactions/${result.data.slug}`)
        } else {
          toast.error('Failed to create transaction', {
            description: result.error || 'Something went wrong. Please try again.'
          })
        }
      } else {
        result = await updateTransaction(transaction!.slug, data as UpdateTransactionData)
        
        if (result.success && result.data) {
          // Save receipt image metadata if a new file was uploaded
          if (pendingUpload) {
            await saveReceiptImage(result.data.id, {
              file_name: pendingUpload.name,
              file_path: pendingUpload.path,
              file_size: pendingUpload.size,
              mime_type: pendingUpload.type,
              storage_bucket: 'receipts'
            })
          }
          
          toast.success('Transaction updated successfully!', {
            description: 'Your changes have been saved.'
          })
          
          // Always redirect to the transaction detail page
          // Use the updated transaction's slug (in case title changed and slug was regenerated)
          const updatedSlug = result.data?.slug || transaction!.slug
          router.push(`/dashboard/transactions/${updatedSlug}`)
        } else {
          toast.error('Failed to update transaction', {
            description: result.error || 'Something went wrong. Please try again.'
          })
        }
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('An unexpected error occurred', {
        description: 'Please try again later.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Enter transaction title"
            {...register('title')}
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select 
              value={watchedType} 
              onValueChange={(value) => setValue('type', value as 'income' | 'expense')}
            >
              <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={watch('category')} 
              onValueChange={(value) => setValue('category', value)}
            >
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <DatePicker
              date={watchedDate ? new Date(watchedDate) : undefined}
              onDateChange={(date) => {
                if (date) {
                  setValue('date', date.toISOString().split('T')[0])
                } else {
                  setValue('date', '')
                }
              }}
              placeholder="Select transaction date"
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Label>Receipt Image (Optional)</Label>
          
          {/* Show existing images for edit mode */}
          {mode === 'edit' && (
            <div>
              {loadingImages ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300" />
                  Loading existing images...
                </div>
              ) : existingImages.length > 0 ? (
                <div className="mb-4">
                  <ReceiptImagesDisplay 
                    images={existingImages} 
                    onImageDeleted={handleImageDeleted}
                  />
                </div>
              ) : null}
            </div>
          )}
          
          {/* Single Image Dropzone */}
          <div>
            <h4 className="text-sm font-medium mb-2">
              {mode === 'edit' ? 'Add New Image' : 'Upload Image'}
            </h4>
            
            {pendingUpload ? (
              <div className="border-2 border-dashed border-green-300 rounded-lg p-6 bg-green-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Receipt uploaded from processing
                      </p>
                      <p className="text-xs text-green-600">
                        {pendingUpload.name}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingUpload(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <SingleImageDropzone 
                {...imageUploadProps} 
                disabled={existingImages.length > 0}
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <RichTextEditor
            content={watchedNotes}
            onChange={(value) => setValue('notes', value)}
            placeholder="Add any additional notes about this transaction..."
          />
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={isSubmitting}
          >
            {getBackButtonText()}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              mode === 'create' ? 'Create Transaction' : 'Update Transaction'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 