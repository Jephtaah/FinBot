'use client';

import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { groupBy } from '@/lib/utils';
import type { Transaction, FinancialSummary } from '@/types/chat';

function generateFinancialSummary(transactions: Transaction[]): FinancialSummary {
  const totalSpending = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const byCategory = groupBy(transactions, 'category');
  
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .map(([category]) => category);

  const monthlySpending = groupBy(transactions, tx => 
    new Date(tx.date).toISOString().slice(0, 7)
  );

  return {
    totalSpending,
    topCategories,
    monthlyTrends: Object.entries(monthlySpending).map(([month, txs]) => ({
      month,
      total: txs.reduce((sum, tx) => sum + Number(tx.amount), 0),
    })),
    recentTransactions: transactions.slice(0, 5),
  };
}

export function useFinancialContext() {
  const { user } = useUser();
  const supabase = createClient();

  return useQuery({
    queryKey: ['financial-context', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('Fetching financial context for user:', user.id);

      const [transactions, receipts, profile] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(50),
        supabase
          .from('receipt_images')
          .select('*')
          .eq('user_id', user.id)
          .order('uploaded_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('monthly_income, monthly_expense, savings_goal, full_name, email')
          .eq('id', user.id)
          .single(),
      ]);

      if (transactions.error) throw transactions.error;
      if (receipts.error) throw receipts.error;
      // Profile error is not critical, we can continue without it
      if (profile.error) {
        console.warn('Could not fetch user profile:', profile.error);
        console.warn('Profile error details:', {
          code: profile.error.code,
          message: profile.error.message,
          details: profile.error.details,
          hint: profile.error.hint,
        });
      } else {
        console.log('Profile query successful:', {
          hasData: !!profile.data,
          profileData: profile.data,
        });
      }

      // Generate signed URLs for receipt images
      const receiptsWithUrls = await Promise.all(
        (receipts.data || []).map(async (receipt) => {
          const { data: signedUrl } = await supabase.storage
            .from('receipts')
            .createSignedUrl(receipt.file_path, 3600); // 1 hour expiry
          
          return {
            ...receipt,
            signedUrl: signedUrl?.signedUrl || '',
          };
        })
      );

      const result = {
        transactions: transactions.data || [],
        receipts: receiptsWithUrls,
        summary: generateFinancialSummary(transactions.data || []),
        profile: profile.data ? {
          fullName: profile.data.full_name,
          email: profile.data.email,
          monthlyIncome: profile.data.monthly_income,
          monthlyExpense: profile.data.monthly_expense,
          savingsGoal: profile.data.savings_goal,
        } : null,
      };
      
      console.log('Financial context loaded:', {
        transactionsCount: result.transactions.length,
        receiptsCount: result.receipts.length,
        totalSpending: result.summary.totalSpending,
        hasProfile: !!result.profile,
        profileData: result.profile,
        monthlyIncome: result.profile?.monthlyIncome || 'Not set',
        monthlyExpense: result.profile?.monthlyExpense || 'Not set',
        savingsGoal: result.profile?.savingsGoal || 'Not set',
      });
      
      return result;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    enabled: !!user,
  });
}