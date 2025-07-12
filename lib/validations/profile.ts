import { z } from 'zod'

// Full name validation schema
export const fullNameSchema = z
  .string()
  .min(1, 'Full name is required')
  .max(255, 'Full name must be less than 255 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes')
  .trim()

// Financial amount validation schema (for monetary values)
export const financialAmountSchema = z
  .number()
  .nonnegative('Amount cannot be negative')
  .max(99999999.99, 'Amount is too large (maximum: $99,999,999.99)')
  .multipleOf(0.01, 'Amount can only have up to 2 decimal places')

// String version for form inputs that will be converted to numbers
export const financialAmountStringSchema = z
  .string()
  .optional()
  .refine((val) => {
    if (!val || val.trim() === '') return true // Allow empty values
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0 && num <= 99999999.99 && /^\d+(\.\d{1,2})?$/.test(val.trim())
  }, {
    message: 'Must be a valid amount with up to 2 decimal places (maximum: $99,999,999.99)'
  })

// Profile update schema
export const profileUpdateSchema = z.object({
  fullName: fullNameSchema
})

// Financial information update schema
export const financialInfoSchema = z.object({
  monthlyIncome: financialAmountStringSchema,
  monthlyExpenses: financialAmountStringSchema,
  savingsGoal: financialAmountStringSchema
}).refine((data) => {
  // Cross-field validation: expenses shouldn't exceed income (if both provided)
  const income = data.monthlyIncome ? parseFloat(data.monthlyIncome) : null
  const expenses = data.monthlyExpenses ? parseFloat(data.monthlyExpenses) : null
  
  if (income !== null && expenses !== null && expenses > income) {
    return false
  }
  return true
}, {
  message: 'Monthly expenses cannot exceed monthly income',
  path: ['monthlyExpenses']
})

// Helper function to safely parse financial amount
export function parseFinancialAmount(value: string | null | undefined): number | null {
  if (!value || value.trim() === '') return null
  
  const parsed = parseFloat(value.trim())
  if (isNaN(parsed)) return null
  
  // Validate the parsed value
  const validation = financialAmountSchema.safeParse(parsed)
  if (!validation.success) return null
  
  return parsed
}

// Helper function to validate and parse form data
export function validateProfileData(formData: FormData) {
  const fullName = formData.get('fullName') as string
  
  const validation = profileUpdateSchema.safeParse({ fullName })
  
  if (!validation.success) {
    throw new Error(validation.error.errors[0]?.message || 'Invalid profile data')
  }
  
  return validation.data
}

// Helper function to validate and parse financial form data
export function validateFinancialData(formData: FormData) {
  const monthlyIncome = formData.get('monthlyIncome') as string
  const monthlyExpenses = formData.get('monthlyExpenses') as string
  const savingsGoal = formData.get('savingsGoal') as string
  
  const validation = financialInfoSchema.safeParse({
    monthlyIncome: monthlyIncome || undefined,
    monthlyExpenses: monthlyExpenses || undefined,
    savingsGoal: savingsGoal || undefined
  })
  
  if (!validation.success) {
    const firstError = validation.error.errors[0]
    throw new Error(firstError?.message || 'Invalid financial data')
  }
  
  return {
    monthlyIncome: parseFinancialAmount(validation.data.monthlyIncome),
    monthlyExpenses: parseFinancialAmount(validation.data.monthlyExpenses),
    savingsGoal: parseFinancialAmount(validation.data.savingsGoal)
  }
}

// Type definitions
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>
export type FinancialInfoData = z.infer<typeof financialInfoSchema>