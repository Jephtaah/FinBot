# AI Receipt Processing Implementation Guide

## Overview
This guide focuses on implementing the receipt-to-transaction workflow in our existing FinBot application. The system will allow users to upload receipt images on the receipts page, process them using OpenAI's GPT-4 Vision API, and automatically redirect to the transaction creation page with pre-filled data.

## Existing Infrastructure

We already have:
1. Receipt images table with proper RLS policies
2. Storage bucket setup for receipts
3. Image upload components and hooks
4. Transaction form with all necessary fields
5. Server actions for saving receipts and transactions

## Implementation Steps

### 1. Add Receipt Processing Function

```typescript
// lib/actions/receipt-images.ts

import OpenAI from 'openai'

const openai = new OpenAI()

export async function processReceiptImage(imageUrl: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the following information from this receipt: store name (as title), total amount, date, and category if possible. Format the response as JSON with fields that match our transaction form: { title: string, amount: number, date: string, category?: string }"
            },
            {
              type: "image_url",
              image_url: imageUrl,
            }
          ],
        },
      ],
      max_tokens: 500,
    })

    const extractedData = JSON.parse(response.choices[0].message.content || '{}')
    return { success: true, data: extractedData }
  } catch (error) {
    console.error('Error processing receipt:', error)
    return { success: false, error: 'Failed to process receipt' }
  }
}
```

### 2. Update Receipt Page

```typescript
// app/dashboard/receipts/page.tsx

import { SingleImageDropzone } from '@/components/ui/single-image-dropzone'
import { useSingleImageUpload } from '@/hooks/use-single-image-upload'
import { processReceiptImage, getReceiptImageUrl } from '@/lib/actions/receipt-images'
import { redirect } from 'next/navigation'

export default function ReceiptsPage() {
  const { user } = useUser()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleUploadComplete = async (uploadedFile: any) => {
    try {
      setIsProcessing(true)
      
      // Get public URL for the uploaded image
      const imageUrl = await getReceiptImageUrl(uploadedFile.path)
      if (!imageUrl) {
        throw new Error('Failed to get image URL')
      }

      // Process the receipt
      const { success, data, error } = await processReceiptImage(imageUrl)
      if (!success || !data) {
        throw new Error(error || 'Failed to process receipt')
      }

      // Redirect to transaction creation with extracted data
      const searchParams = new URLSearchParams({
        title: data.title || '',
        amount: data.amount?.toString() || '',
        date: data.date || new Date().toISOString().split('T')[0],
        category: data.category || '',
        receipt_path: uploadedFile.path
      })

      redirect(`/dashboard/transactions/new?${searchParams.toString()}`)
    } catch (error) {
      toast.error('Failed to process receipt', {
        description: error.message
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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Upload Receipt</h1>
      
      <div className="max-w-md mx-auto">
        <SingleImageDropzone
          {...uploadProps}
          disabled={isProcessing}
        />
        
        {isProcessing && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300 mx-auto mb-2" />
            Processing receipt...
          </div>
        )}
      </div>
    </div>
  )
}
```

### 3. Update Transaction Form

```typescript
// components/forms/transaction-form.tsx

// Add to existing form component
useEffect(() => {
  // Check for receipt data in URL params
  const params = new URLSearchParams(window.location.search)
  if (params.has('title')) {
    setValue('title', params.get('title') || '')
    setValue('amount', Number(params.get('amount')) || 0)
    setValue('date', params.get('date') || new Date().toISOString().split('T')[0])
    setValue('category', params.get('category') || '')
    
    // If receipt path is provided, save it after transaction creation
    const receiptPath = params.get('receipt_path')
    if (receiptPath) {
      setPendingUpload({
        path: receiptPath,
        type: 'image/jpeg' // Default, since we already validated during upload
      })
    }
  }
}, [setValue])
```

### 4. Error Handling

1. **Image Upload Errors**
   - Already handled by `useSingleImageUpload` hook
   - Includes size limits, file type validation, and storage errors

2. **Processing Errors**
   - Invalid or unclear receipt images
   - OpenAI API errors
   - JSON parsing errors

3. **Navigation Errors**
   - Invalid URL parameters
   - Missing required fields
   - Form validation errors

### 5. Testing

1. **Upload different receipt types**
   - Clear, well-lit receipts
   - Blurry or low-quality images
   - Different formats (restaurant, retail, services)

2. **Verify extracted data**
   - Check accuracy of store names
   - Validate amount extraction
   - Confirm date parsing
   - Test category detection

3. **Test error scenarios**
   - Upload invalid files
   - Test network issues
   - Handle API failures
   - Verify error messages

### 6. Security Considerations

1. **File Upload**
   - Already implemented size limits (5MB)
   - Validated file types
   - User-specific storage paths
   - RLS policies in place

2. **API Security**
   - OpenAI key stored server-side
   - User session validation
   - Input sanitization
   - URL parameter validation

### 7. Future Improvements

1. **Enhanced Processing**
   - Extract line items
   - Detect payment method
   - Multiple receipts upload
   - Receipt archival

2. **User Experience**
   - Preview extracted data
   - Manual correction interface
   - Processing status updates
   - Batch processing

3. **Integration**
   - Export to accounting software
   - Receipt categorization learning
   - Historical analysis
   - Budget tracking 