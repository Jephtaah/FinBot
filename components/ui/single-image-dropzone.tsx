'use client'

import { cn } from '@/lib/utils'
import { type UseSingleImageUploadReturn } from '@/hooks/use-single-image-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, File, Loader2, X, Image as ImageIcon } from 'lucide-react'

export const formatBytes = (
  bytes: number,
  decimals = 2
) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

interface SingleImageDropzoneProps extends UseSingleImageUploadReturn {
  className?: string
  disabled?: boolean
}

export function SingleImageDropzone({
  className,
  selectedFile,
  uploadedFile,
  loading,
  error,
  isDragActive,
  isDragReject,
  maxFileSize,
  removeFile,
  selectFile,
  getRootProps,
  getInputProps,
  isUploaded,
  disabled: externallyDisabled = false,
}: SingleImageDropzoneProps) {
  const hasFile = selectedFile || uploadedFile
  const isInvalid = isDragReject || (error !== null)
  const isDisabled = !!uploadedFile || externallyDisabled // Disable when there's an uploaded file or externally disabled

  if (isUploaded && uploadedFile) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-600">Upload successful!</p>
              <p className="text-xs text-muted-foreground">{uploadedFile.name}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={removeFile}
              className="shrink-0"
            >
              <X size={14} className="mr-1" />
              Remove
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (selectedFile) {
    const isImage = selectedFile.type.startsWith('image/')
    const hasErrors = selectedFile.errors.length > 0

    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {isImage && selectedFile.preview ? (
              <div className="h-16 w-16 rounded-lg border overflow-hidden shrink-0 bg-muted">
                <img 
                  src={selectedFile.preview} 
                  alt={selectedFile.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-lg border bg-muted flex items-center justify-center shrink-0">
                <File size={24} className="text-muted-foreground" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" title={selectedFile.name}>
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(selectedFile.size)}
              </p>
              {hasErrors && (
                <p className="text-xs text-red-500 mt-1">
                  {selectedFile.errors[0]}
                </p>
              )}
              {error && (
                <p className="text-xs text-red-500 mt-1">
                  {error}
                </p>
              )}
              {loading && (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs text-muted-foreground">Uploading...</span>
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="shrink-0"
              disabled={loading}
            >
              <X size={14} />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div
      {...(isDisabled ? {} : getRootProps({
        className: cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200',
          'hover:border-primary/50 hover:bg-primary/5',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          className,
          isDragActive && 'border-primary bg-primary/10',
          isInvalid && 'border-red-500 bg-red-50',
          !isDisabled && 'cursor-pointer'
        ),
      }))}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200',
        className,
        isDisabled && 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60',
        !isDisabled && [
          'cursor-pointer',
          'hover:border-primary/50 hover:bg-primary/5',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          isDragActive && 'border-primary bg-primary/10',
          isInvalid && 'border-red-500 bg-red-50'
        ]
      )}
    >
      {!isDisabled && <input {...getInputProps()} />}
      
      <div className="flex flex-col items-center gap-3">
        <div className={cn(
          'p-3 rounded-full',
          isDisabled ? 'bg-gray-100' : 
          isDragActive ? 'bg-primary/20' : 'bg-muted',
          isInvalid && !isDisabled && 'bg-red-100'
        )}>
          <ImageIcon size={24} className={cn(
            'text-muted-foreground',
            isDisabled && 'text-gray-400',
            !isDisabled && isDragActive && 'text-primary',
            isInvalid && !isDisabled && 'text-red-500'
          )} />
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {isDisabled 
              ? externallyDisabled 
                ? 'Remove existing images to upload a new one'
                : 'Remove current image to upload a new one'
              : isDragActive 
                ? 'Drop your image here' 
                : 'Drop an image here, or click to select'
            }
          </p>
          {!isDisabled && (
            <>
              <p className="text-xs text-muted-foreground">
                Maximum file size: {formatBytes(maxFileSize)}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: JPEG, PNG, WebP, PDF
              </p>
            </>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-500 max-w-full break-words">
            {error}
          </p>
        )}

        {!isDisabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              selectFile()
            }}
            className="mt-2"
          >
            Select File
          </Button>
        )}
      </div>
    </div>
  )
} 