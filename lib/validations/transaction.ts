import { z } from 'zod'

// Transaction type enum schema
export const transactionTypeSchema = z.enum(['income', 'expense'])

// Base transaction schema for creation and updates
export const transactionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  type: transactionTypeSchema,
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(999999999.99, 'Amount is too large'),
  category: z.string().min(1, 'Category is required').max(100, 'Category must be less than 100 characters'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  notes: z.any().optional(), // TipTap JSON content
  receipt_url: z.string().url('Invalid URL').optional().or(z.literal('')),
})

// Schema for creating a new transaction
export const createTransactionSchema = transactionSchema

// Schema for updating a transaction (all fields optional except what's needed)
export const updateTransactionSchema = transactionSchema.partial()

// Schema for transaction form data (includes string amount for form handling)
export const transactionFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  type: transactionTypeSchema,
  amount: z.string().min(1, 'Amount is required'),
  category: z.string().min(1, 'Category is required').max(100, 'Category must be less than 100 characters'),
  date: z.string().min(1, 'Date is required'),
  notes: z.any().optional(),
  receipt_url: z.string().optional(),
})

export type TransactionFormData = z.infer<typeof transactionFormSchema>
export type CreateTransactionData = z.infer<typeof createTransactionSchema>
export type UpdateTransactionData = z.infer<typeof updateTransactionSchema> 