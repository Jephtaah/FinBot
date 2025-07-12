'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateFinancialInfo } from '@/lib/actions/profile'
import { toast } from 'sonner'

interface FinancialFormProps {
  monthlyIncome?: number | null
  monthlyExpense?: number | null
  savingsGoal?: number | null
}

export function FinancialForm({ monthlyIncome, monthlyExpense, savingsGoal }: FinancialFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formValues, setFormValues] = useState({
    monthlyIncome: monthlyIncome?.toString() || '',
    monthlyExpenses: monthlyExpense?.toString() || '',
    savingsGoal: savingsGoal?.toString() || ''
  })
  const [isChanged, setIsChanged] = useState(false)

  // Check if any form values have changed from their initial values
  useEffect(() => {
    const initialValues = {
      monthlyIncome: monthlyIncome?.toString() || '',
      monthlyExpenses: monthlyExpense?.toString() || '',
      savingsGoal: savingsGoal?.toString() || ''
    }

    const hasChanged = 
      formValues.monthlyIncome !== initialValues.monthlyIncome ||
      formValues.monthlyExpenses !== initialValues.monthlyExpenses ||
      formValues.savingsGoal !== initialValues.savingsGoal

    setIsChanged(hasChanged)
  }, [formValues, monthlyIncome, monthlyExpense, savingsGoal])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    
    try {
      // Validate numeric inputs before submission
      const monthlyIncome = formData.get('monthlyIncome') as string
      const monthlyExpenses = formData.get('monthlyExpenses') as string
      const savingsGoal = formData.get('savingsGoal') as string
      
      const maxValue = 99999999.99 // Maximum for numeric(10,2)
      
      const validateNumber = (value: string, fieldName: string) => {
        if (value && value.trim() !== '') {
          const num = parseFloat(value)
          if (isNaN(num)) {
            throw new Error(`${fieldName} must be a valid number`)
          }
          if (num < 0) {
            throw new Error(`${fieldName} cannot be negative`)
          }
          if (num > maxValue) {
            throw new Error(`${fieldName} cannot exceed $99,999,999.99`)
          }
        }
      }
      
      validateNumber(monthlyIncome, 'Monthly Income')
      validateNumber(monthlyExpenses, 'Monthly Expenses')
      validateNumber(savingsGoal, 'Savings Goal')
      
      const result = await updateFinancialInfo(formData)
      
      if (result.success) {
        toast.success('Financial information updated successfully', {
          description: 'Your financial goals and preferences have been saved.'
        })
        
        // Update the form values to match what was just saved
        setFormValues({
          monthlyIncome: monthlyIncome || '',
          monthlyExpenses: monthlyExpenses || '',
          savingsGoal: savingsGoal || ''
        })
        
        // Reset the changed state
        setIsChanged(false)
      } else {
        toast.error('Failed to update financial information', {
          description: result.error || 'Please try again.'
        })
      }
    } catch (error: any) {
      toast.error('Invalid input', {
        description: error.message || 'An unexpected error occurred. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="monthlyIncome">Monthly Income</Label>
        <Input 
          id="monthlyIncome" 
          name="monthlyIncome"
          type="number"
          step="0.01"
          min="0"
          max="99999999.99"
          placeholder="Enter your monthly income"
          value={formValues.monthlyIncome}
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Maximum: $99,999,999.99
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="monthlyExpenses">Expected Monthly Expenses</Label>
        <Input 
          id="monthlyExpenses" 
          name="monthlyExpenses"
          type="number"
          step="0.01"
          min="0"
          max="99999999.99"
          placeholder="Enter expected monthly expenses"
          value={formValues.monthlyExpenses}
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Maximum: $99,999,999.99
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="savingsGoal">Savings Goal</Label>
        <Input 
          id="savingsGoal" 
          name="savingsGoal"
          type="number"
          step="0.01"
          min="0"
          max="99999999.99"
          placeholder="Enter your savings goal"
          value={formValues.savingsGoal}
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Maximum: $99,999,999.99
        </p>
      </div>
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || !isChanged}
      >
        {isLoading ? 'Updating...' : 'Update Financial Info'}
      </Button>
    </form>
  )
}