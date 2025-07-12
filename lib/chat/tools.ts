import { tool } from 'ai';
import { z } from 'zod';
import type { FinancialContext } from '@/types/chat';

export function getFinancialTools(context: FinancialContext | null) {
  if (!context) {
    return undefined;
  }

  return {
    viewTransactionSummary: tool({
      description: 'Get a summary of recent transactions',
      parameters: z.object({
        limit: z.number().optional().describe('Number of transactions to summarize (default: 10)'),
        type: z.enum(['income', 'expense', 'all']).optional().describe('Type of transactions to include'),
      }),
      execute: async ({ limit = 10, type = 'all' }) => {
        let transactions = context.transactions;
        
        if (type !== 'all') {
          transactions = transactions.filter(t => t.type === type);
        }
        
        const summary = {
          transactions: transactions.slice(0, limit).map(t => ({
            title: t.title,
            amount: t.amount,
            category: t.category,
            date: t.date,
            type: t.type,
          })),
          totalAmount: transactions.slice(0, limit).reduce((sum, t) => sum + t.amount, 0),
          categories: [...new Set(transactions.slice(0, limit).map(t => t.category))],
        };
        
        return summary;
      },
    }),

    getCategoryBreakdown: tool({
      description: 'Get spending breakdown by category',
      parameters: z.object({
        type: z.enum(['income', 'expense', 'all']).optional().describe('Type of transactions to analyze'),
      }),
      execute: async ({ type = 'expense' }) => {
        let transactions = context.transactions;
        
        if (type !== 'all') {
          transactions = transactions.filter(t => t.type === type);
        }
        
        const breakdown = transactions.reduce((acc, t) => {
          if (!acc[t.category]) {
            acc[t.category] = { total: 0, count: 0 };
          }
          acc[t.category].total += t.amount;
          acc[t.category].count += 1;
          return acc;
        }, {} as Record<string, { total: number; count: number }>);
        
        return {
          categories: Object.entries(breakdown)
            .map(([category, data]) => ({
              category,
              total: data.total,
              count: data.count,
              average: data.total / data.count,
            }))
            .sort((a, b) => b.total - a.total),
        };
      },
    }),

    getMonthlyTrends: tool({
      description: 'Get monthly spending or income trends',
      parameters: z.object({
        type: z.enum(['income', 'expense', 'all']).optional().describe('Type of transactions to analyze'),
        months: z.number().optional().describe('Number of months to include (default: 6)'),
      }),
      execute: async ({ type = 'expense', months = 6 }) => {
        let transactions = context.transactions;
        
        if (type !== 'all') {
          transactions = transactions.filter(t => t.type === type);
        }
        
        const monthlyData = transactions.reduce((acc, t) => {
          const month = new Date(t.date).toISOString().slice(0, 7);
          if (!acc[month]) {
            acc[month] = { total: 0, count: 0 };
          }
          acc[month].total += t.amount;
          acc[month].count += 1;
          return acc;
        }, {} as Record<string, { total: number; count: number }>);
        
        const trends = Object.entries(monthlyData)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .slice(0, months)
          .map(([month, data]) => ({
            month,
            total: data.total,
            count: data.count,
            average: data.total / data.count,
          }))
          .reverse();
        
        return { trends };
      },
    }),

    viewRecentReceipts: tool({
      description: 'View recent receipt images and their metadata',
      parameters: z.object({
        limit: z.number().optional().describe('Number of receipts to show (default: 5)'),
      }),
      execute: async ({ limit = 5 }) => {
        const receipts = context.receipts.slice(0, limit).map(r => ({
          id: r.id,
          fileName: r.file_name,
          uploadDate: r.uploaded_at,
          metadata: r.metadata,
          hasTransaction: !!r.transaction_id,
        }));
        
        return { receipts };
      },
    }),

    analyzeSpendingPattern: tool({
      description: 'Analyze spending patterns and identify potential savings',
      parameters: z.object({
        category: z.string().optional().describe('Specific category to analyze'),
      }),
      execute: async ({ category }) => {
        let transactions = context.transactions.filter(t => t.type === 'expense');
        
        if (category) {
          transactions = transactions.filter(t => t.category.toLowerCase().includes(category.toLowerCase()));
        }
        
        const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0);
        const avgTransaction = totalSpending / transactions.length;
        
        const categoryBreakdown = transactions.reduce((acc, t) => {
          if (!acc[t.category]) acc[t.category] = [];
          acc[t.category].push(t.amount);
          return acc;
        }, {} as Record<string, number[]>);
        
        const insights = Object.entries(categoryBreakdown).map(([cat, amounts]) => ({
          category: cat,
          total: amounts.reduce((sum, a) => sum + a, 0),
          average: amounts.reduce((sum, a) => sum + a, 0) / amounts.length,
          frequency: amounts.length,
          maxAmount: Math.max(...amounts),
          minAmount: Math.min(...amounts),
        }));
        
        return {
          totalSpending,
          avgTransaction,
          transactionCount: transactions.length,
          insights: insights.sort((a, b) => b.total - a.total),
          profile: context.profile,
          budgetComparison: context.profile?.monthlyExpense ? {
            target: context.profile.monthlyExpense,
            actual: totalSpending,
            difference: context.profile.monthlyExpense - totalSpending,
            isOverBudget: totalSpending > context.profile.monthlyExpense,
          } : null,
        };
      },
    }),

    analyzeBudgetPerformance: tool({
      description: 'Compare actual spending against budget targets and savings goals',
      parameters: z.object({}),
      execute: async () => {
        if (!context.profile) {
          return {
            error: 'No financial profile found. User should complete their profile first.',
          };
        }

        const totalSpending = context.transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalIncome = context.transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          profile: {
            monthlyIncome: context.profile.monthlyIncome,
            monthlyExpenseTarget: context.profile.monthlyExpense,
            savingsGoal: context.profile.savingsGoal,
          },
          actual: {
            totalIncome,
            totalSpending,
            actualSurplus: totalIncome - totalSpending,
          },
          analysis: {
            budgetVariance: context.profile.monthlyExpense 
              ? context.profile.monthlyExpense - totalSpending 
              : null,
            incomeGoalProgress: context.profile.monthlyIncome 
              ? (totalIncome / context.profile.monthlyIncome) * 100 
              : null,
            savingsProgress: context.profile.savingsGoal 
              ? ((totalIncome - totalSpending) / context.profile.savingsGoal) * 100 
              : null,
          },
          recommendations: {
            shouldReduceSpending: context.profile.monthlyExpense 
              ? totalSpending > context.profile.monthlyExpense 
              : false,
            savingsGapExists: context.profile.savingsGoal 
              ? (totalIncome - totalSpending) < context.profile.savingsGoal 
              : false,
          },
        };
      },
    }),
  };
}