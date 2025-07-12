'use client'

import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'

interface UseSupabaseUploadProps {
  bucketName: string
  path?: string
  allowedMimeTypes?: string[]
  maxFiles?: number
  maxFileSize?: number
  onUploadComplete?: (files: UploadedFile[]) => void
  onUploadError?: (error: Error) => void
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
  errors: Array<{ message: string }>
}

interface UploadError {
  name: string
  message: string
}

export interface UseSupabaseUploadReturn {
  files: FileWithPreview[]
  setFiles: (files: FileWithPreview[]) => void
  loading: boolean
  successes: string[]
  errors: UploadError[]
  isSuccess: boolean
  isDragActive: boolean
  isDragReject: boolean
  maxFiles: number
  maxFileSize: number
  inputRef: React.RefObject<HTMLInputElement>
  onUpload: () => Promise<void>
  getRootProps: () => any
  getInputProps: () => any
  uploadedFiles: UploadedFile[]
}

export function useSupabaseUpload({
  bucketName,
  path = '',
  allowedMimeTypes = [],
  maxFiles = 5,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  onUploadComplete,
  onUploadError,
}: UseSupabaseUploadProps): UseSupabaseUploadReturn {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [loading, setLoading] = useState(false)
  const [successes, setSuccesses] = useState<string[]>([])
  const [errors, setErrors] = useState<UploadError[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const validateFile = useCallback((file: File): string[] => {
    const errors: string[] = []
    
    if (file.size > maxFileSize) {
      errors.push(`File is larger than ${maxFileSize} bytes`)
    }
    
    if (allowedMimeTypes.length > 0) {
      const isAllowed = allowedMimeTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1))
        }
        return file.type === type
      })
      
      if (!isAllowed) {
        errors.push(`File type ${file.type} is not allowed`)
      }
    }
    
    return errors
  }, [maxFileSize, allowedMimeTypes])

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    const newFiles: FileWithPreview[] = []
    
    // Process accepted files
    acceptedFiles.forEach(file => {
      const errors = validateFile(file)
      const fileWithPreview = Object.assign(file, {
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        errors: errors.map(msg => ({ message: msg }))
      })
      newFiles.push(fileWithPreview)
    })
    
    // Process rejected files
    rejectedFiles.forEach(({ file, errors: dropzoneErrors }) => {
      const fileWithPreview = Object.assign(file, {
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        errors: dropzoneErrors
      })
      newFiles.push(fileWithPreview)
    })
    
    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles))
    setErrors([])
    setSuccesses([])
  }, [validateFile, maxFiles])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxFiles,
    maxSize: maxFileSize,
    accept: allowedMimeTypes.length > 0 ? allowedMimeTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>) : undefined,
  })

  const uploadFile = async (file: FileWithPreview): Promise<UploadedFile | null> => {
    try {
      const fileName = `${Date.now()}-${file.name}`
      const filePath = path ? `${path}/${fileName}` : fileName
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)

      return {
        name: file.name,
        path: filePath,
        url: publicUrl,
        size: file.size,
        type: file.type
      }
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const onUpload = async () => {
    if (files.length === 0) return
    
    setLoading(true)
    setErrors([])
    setSuccesses([])
    
    const validFiles = files.filter(file => file.errors.length === 0)
    const uploadPromises = validFiles.map(async (file) => {
      try {
        const uploadedFile = await uploadFile(file)
        if (uploadedFile) {
          setSuccesses(prev => [...prev, file.name])
          return uploadedFile
        }
        return null
      } catch (error) {
        setErrors(prev => [...prev, { 
          name: file.name, 
          message: error instanceof Error ? error.message : 'Upload failed' 
        }])
        return null
      }
    })

    try {
      const results = await Promise.all(uploadPromises)
      const successfulUploads = results.filter((result): result is UploadedFile => result !== null)
      
      setUploadedFiles(prev => [...prev, ...successfulUploads])
      
      if (onUploadComplete && successfulUploads.length > 0) {
        onUploadComplete(successfulUploads)
      }
    } catch (error) {
      if (onUploadError) {
        onUploadError(error instanceof Error ? error : new Error('Upload failed'))
      }
    } finally {
      setLoading(false)
    }
  }

  const isSuccess = successes.length > 0 && errors.length === 0 && !loading

  return {
    files,
    setFiles,
    loading,
    successes,
    errors,
    isSuccess,
    isDragActive,
    isDragReject,
    maxFiles,
    maxFileSize,
    inputRef,
    onUpload,
    getRootProps,
    getInputProps,
    uploadedFiles,
  }
}
