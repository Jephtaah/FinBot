// Main types index - exports all type definitions

// Database types
export * from './database'

// Profile types
export * from './profile'

// Auth types
export * from './auth'

// Common utility types
export type AsyncResult<T> = {
  data?: T
  error?: string
  success: boolean
}

export type PaginationParams = {
  page?: number
  limit?: number
  offset?: number
}

export type SortParams = {
  column: string
  ascending?: boolean
}

export type FilterParams = {
  [key: string]: any
} 