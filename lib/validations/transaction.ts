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
    .max(99999999.99, 'Amount is too large (maximum: $99,999,999.99)')
    .multipleOf(0.01, 'Amount can only have up to 2 decimal places'),
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
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters').trim(),
  type: transactionTypeSchema,
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => {
      const num = parseFloat(val)
      return !isNaN(num) && num > 0 && num <= 99999999.99 && /^\d+(\.\d{1,2})?$/.test(val.trim())
    }, {
      message: 'Must be a valid positive amount with up to 2 decimal places (maximum: $99,999,999.99)'
    }),
  category: z.string().min(1, 'Category is required').max(100, 'Category must be less than 100 characters').trim(),
  date: z.string().min(1, 'Date is required').refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  notes: z.any().optional(),
  receipt_url: z.string().optional(),
})

export type TransactionFormData = z.infer<typeof transactionFormSchema>
export type CreateTransactionData = z.infer<typeof createTransactionSchema>
export type UpdateTransactionData = z.infer<typeof updateTransactionSchema> 