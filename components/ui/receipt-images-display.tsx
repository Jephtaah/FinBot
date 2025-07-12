'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { deleteReceiptImage } from '@/lib/actions/receipt-images'
import { File, X, ExternalLink } from 'lucide-react'
import { formatBytes } from '@/components/ui/dropzone'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type ReceiptImageRow = Database['public']['Tables']['receipt_images']['Row']

interface ReceiptImagesDisplayProps {
  images: ReceiptImageRow[]
  onImageDeleted?: () => void
}

export function ReceiptImagesDisplay({ images, onImageDeleted }: ReceiptImagesDisplayProps) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const handleDelete = async (imageId: string) => {
    setDeletingIds(prev => new Set(prev).add(imageId))
    
    try {
      const result = await deleteReceiptImage(imageId)
      
      if (result.success) {
        toast.success('Receipt image deleted successfully')
        onImageDeleted?.()
      } else {
        toast.error('Failed to delete receipt image', {
          description: result.error
        })
      }
    } catch {
      toast.error('An error occurred while deleting the image')
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(imageId)
        return newSet
      })
    }
  }

  const getPublicUrl = (filePath: string) => {
    // Construct the public URL for the Supabase storage bucket
    // In a client component, we can access process.env variables that start with NEXT_PUBLIC_
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL is not defined')
      return ''
    }
    return `${supabaseUrl}/storage/v1/object/public/receipts/${filePath}`
  }

  if (images.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Existing Receipt Images</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {images.map((image) => {
          const isDeleting = deletingIds.has(image.id)
          const isImage = image.mime_type?.startsWith('image/') || false
          const publicUrl = getPublicUrl(image.file_path)

          return (
            <Card key={image.id} className="relative">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {isImage ? (
                    <div className="h-12 w-12 rounded border overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                      <img 
                        src={publicUrl} 
                        alt={image.file_name} 
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          // Fallback to file icon if image fails to load
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded border bg-muted flex items-center justify-center">
                      <File size={20} />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={image.file_name}>
                      {image.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {image.file_size ? formatBytes(image.file_size) : 'Unknown size'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(image.uploaded_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between mt-3 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="text-xs"
                  >
                    <a 
                      href={publicUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink size={12} />
                      View
                    </a>
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(image.id)}
                    disabled={isDeleting}
                    className="text-xs"
                  >
                    {isDeleting ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                    ) : (
                      <X size={12} />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 