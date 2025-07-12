import type { Database } from './database';

// Re-export base transaction type from database types
export type Transaction = Database['public']['Tables']['transactions']['Row'];

export interface Message {
  id?: string;
  user_id: string;
  assistant_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface Receipt {
  id: string;
  file_name: string;
  file_path: string;
  signedUrl: string;
  transaction_id?: string;
  metadata?: {
    store?: string;
    amount?: number;
    items?: Array<{
      name: string;
      price: number;
      quantity?: number;
    }>;
    date?: string;
  };
  uploaded_at: string;
}

export interface FinancialSummary {
  totalSpending: number;
  topCategories: string[];
  monthlyTrends: Array<{
    month: string;
    total: number;
  }>;
  recentTransactions: Transaction[];
}

export interface FinancialProfile {
  fullName: string | null;
  email: string | null;
  monthlyIncome: number | null;
  monthlyExpense: number | null;
  savingsGoal: number | null;
}

export interface FinancialContext {
  transactions: Transaction[];
  receipts: Receipt[];
  summary: FinancialSummary;
  profile: FinancialProfile | null;
}

// Assistant-specific types
export interface Assistant {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
}

export type AssistantId = 'income' | 'expenditure';