'use client'

import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'

interface UseSingleImageUploadProps {
  bucketName: string
  path?: string
  allowedMimeTypes?: string[]
  maxFileSize?: number
  autoUpload?: boolean
  disabled?: boolean
  onUploadComplete?: (file: UploadedFile) => void
  onUploadError?: (error: Error) => void
  onFileSelected?: (file: FileWithPreview | null) => void
}

interface UploadedFile {
  name: string
  path: string
  url: string
  size: number
  type: string
}

interface FileWithPreview extends File {
  preview?: string
  errors: string[]
}

export interface UseSingleImageUploadReturn {
  selectedFile: FileWithPreview | null
  uploadedFile: UploadedFile | null
  loading: boolean
  error: string | null
  isDragActive: boolean
  isDragReject: boolean
  maxFileSize: number
  inputRef: React.RefObject<HTMLInputElement | null>
  uploadFile: () => Promise<void>
  removeFile: () => void
  selectFile: () => void
  getRootProps: () => any
  getInputProps: () => any
  isUploaded: boolean
}

export function useSingleImageUpload({
  bucketName,
  path = '',
  allowedMimeTypes = [],
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  autoUpload = true,
  disabled = false,
  onUploadComplete,
  onUploadError,
  onFileSelected,
}: UseSingleImageUploadProps): UseSingleImageUploadReturn {
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(null)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const validateFile = useCallback((file: File): string[] => {
    const errors: string[] = []
    
    if (file.size > maxFileSize) {
      errors.push(`File size must be less than ${(maxFileSize / (1024 * 1024)).toFixed(1)}MB`)
    }
    
    if (allowedMimeTypes.length > 0) {
      const isAllowed = allowedMimeTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1))
        }
        return file.type === type
      })
      
      if (!isAllowed) {
        errors.push(`File type ${file.type} is not supported`)
      }
    }
    
    return errors
  }, [maxFileSize, allowedMimeTypes])

  const uploadFileToStorage = useCallback(async (file: FileWithPreview) => {
    setLoading(true)
    setError(null)
    
    try {
      const fileName = `${Date.now()}-${file.name}`
      const filePath = path ? `${path}/${fileName}` : fileName
      
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)

      const uploadedFileData: UploadedFile = {
        name: file.name,
        path: filePath,
        url: publicUrl,
        size: file.size,
        type: file.type
      }
      
      setUploadedFile(uploadedFileData)
      
      if (onUploadComplete) {
        onUploadComplete(uploadedFileData)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      if (onUploadError) {
        onUploadError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setLoading(false)
    }
  }, [bucketName, path, supabase, onUploadComplete, onUploadError])

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Don't allow new uploads if disabled, there's already an uploaded file, or external disable
    if (disabled || uploadedFile) {
      setError(disabled 
        ? 'Please remove existing images before uploading a new one'
        : 'Please remove the current image before uploading a new one'
      )
      return
    }
    
    setError(null)
    
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0] // Only take the first file
      const validationErrors = validateFile(file)
      
      const fileWithPreview: FileWithPreview = Object.assign(file, {
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        errors: validationErrors
      })
      
      setSelectedFile(fileWithPreview)
      onFileSelected?.(fileWithPreview)
      
      if (validationErrors.length > 0) {
        setError(validationErrors[0])
      } else if (autoUpload) {
        // Automatically upload if no validation errors and autoUpload is enabled
        await uploadFileToStorage(fileWithPreview)
      }
    } else if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors && rejection.errors.length > 0) {
        setError(rejection.errors[0].message)
      } else {
        setError('File was rejected')
      }
    }
  }, [validateFile, onFileSelected, autoUpload, uploadFileToStorage, uploadedFile, disabled])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: maxFileSize,
    accept: allowedMimeTypes.length > 0 ? allowedMimeTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>) : undefined,
    multiple: false,
  })

  const uploadFile = async () => {
    if (!selectedFile || selectedFile.errors.length > 0) return
    await uploadFileToStorage(selectedFile)
  }

  const removeFile = useCallback(() => {
    if (selectedFile?.preview) {
      URL.revokeObjectURL(selectedFile.preview)
    }
    setSelectedFile(null)
    setUploadedFile(null)
    setError(null)
    onFileSelected?.(null)
  }, [selectedFile, onFileSelected])

  const selectFile = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const isUploaded = !!uploadedFile

  return {
    selectedFile,
    uploadedFile,
    loading,
    error,
    isDragActive,
    isDragReject,
    maxFileSize,
    inputRef,
    uploadFile,
    removeFile,
    selectFile,
    getRootProps,
    getInputProps,
    isUploaded,
  }
} 