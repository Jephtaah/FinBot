import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CreditCard, TrendingUp, TrendingDown, Calendar, DollarSign, Receipt } from 'lucide-react'

interface TransactionData {
  id: string
  user_id: string
  title: string
  slug: string
  type: 'income' | 'expense'
  amount: string
  category: string
  date: string
  source: string
  created_at: string
  receipt_count?: number
  user: {
    email: string
    full_name: string | null
  } | null
}

async function getAllTransactions(): Promise<TransactionData[]> {
  const supabase = await createClient()
  
  try {
    // Use simple query first - avoid problematic joins
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching transactions:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return []
    }
    
    if (!transactions) return []
    
    console.log(`Fetched ${transactions.length} transactions, now getting user data...`)
    
    // Get additional data separately (more reliable than joins)
    const transactionsWithData = await Promise.all(
      transactions.map(async (transaction) => {
        // Get user data
        const { data: user, error: userError } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', transaction.user_id)
          .single()
        
        if (userError) {
          console.error(`Error fetching user for transaction ${transaction.id}:`, userError)
        }
        
        // Get receipt count
        const { count: receiptCount, error: receiptError } = await supabase
          .from('receipt_images')
          .select('*', { count: 'exact', head: true })
          .eq('transaction_id', transaction.id)
        
        if (receiptError) {
          console.error(`Error counting receipts for transaction ${transaction.id}:`, receiptError)
        }
        
        return {
          ...transaction,
          user: user || null,
          receipt_count: receiptCount || 0
        }
      })
    )
    
    console.log(`Successfully processed ${transactionsWithData.length} transactions with user data`)
    return transactionsWithData
  } catch (err) {
    console.error('Error in getAllTransactions:', err)
    return []
  }
}

async function getTransactionStats() {
  const supabase = await createClient()
  
  try {
    const { count: totalTransactions, error: totalError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
    
    if (totalError) {
      console.error('Error getting total transactions:', totalError)
      return {
        total: 0,
        income: 0,
        expense: 0,
        totalIncome: 0,
        totalExpenses: 0,
        recent: 0,
        topCategories: []
      }
    }
    
    const { count: incomeTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'income')
    
    const { count: expenseTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'expense')
    
    const { data: incomeData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('type', 'income')
    
    const { data: expenseData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('type', 'expense')
    
    const totalIncome = incomeData?.reduce((sum, t) => {
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount)
      return sum + amount
    }, 0) || 0
    const totalExpenses = expenseData?.reduce((sum, t) => {
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount)
      return sum + amount
    }, 0) || 0
    
    const { count: recentTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    
    // Get category breakdown
    const { data: categoryData } = await supabase
      .from('transactions')
      .select('category, type')
    
    const categories = categoryData?.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    const topCategories = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }))
    
    return {
      total: totalTransactions || 0,
      income: incomeTransactions || 0,
      expense: expenseTransactions || 0,
      totalIncome,
      totalExpenses,
      recent: recentTransactions || 0,
      topCategories
    }
  } catch (err) {
    console.error('Error in getTransactionStats:', err)
    return {
      total: 0,
      income: 0,
      expense: 0,
      totalIncome: 0,
      totalExpenses: 0,
      recent: 0,
      topCategories: []
    }
  }
}

export default async function AdminTransactionsPage() {
  const [transactions, stats] = await Promise.all([
    getAllTransactions(),
    getTransactionStats()
  ])

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 md:gap-4 md:p-4 lg:gap-6 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight truncate">Transactions</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Manage and view all user transactions
          </p>
        </div>
      </div>

      {/* Transaction Stats */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-1.5 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center justify-between">
              Total Transactions
              <CreditCard className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg md:text-xl lg:text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All transactions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-1.5 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center justify-between">
              Income
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600 flex-shrink-0" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg md:text-xl lg:text-2xl font-bold text-green-600">{stats.income}</div>
            <div className="text-xs text-muted-foreground mt-1">
              ${stats.totalIncome.toFixed(2)} total
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-1.5 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center justify-between">
              Expenses
              <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-600 flex-shrink-0" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg md:text-xl lg:text-2xl font-bold text-red-600">{stats.expense}</div>
            <div className="text-xs text-muted-foreground mt-1">
              ${stats.totalExpenses.toFixed(2)} total
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-1.5 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center justify-between">
              Net Amount
              <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-lg md:text-xl lg:text-2xl font-bold ${
              (stats.totalIncome - stats.totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${Math.abs(stats.totalIncome - stats.totalExpenses).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(stats.totalIncome - stats.totalExpenses) >= 0 ? 'Net positive' : 'Net negative'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-1.5 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center justify-between">
              Recent
              <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg md:text-xl lg:text-2xl font-bold">{stats.recent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Top Categories</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Most frequently used transaction categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {stats.topCategories.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between p-2 md:p-3 border rounded">
                <span className="text-xs md:text-sm font-medium truncate">{cat.category}</span>
                <Badge variant="secondary" className="text-xs">{cat.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">All Transactions</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Complete list of all user transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-6 md:py-8">
              <CreditCard className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 mx-auto mb-3 md:mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm md:text-base text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Receipts</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        <div className="max-w-[200px] truncate" title={transaction.title}>
                          {transaction.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          /{transaction.slug}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {transaction.user?.full_name || 'Not set'}
                          </div>
                          <div className="text-muted-foreground">
                            {transaction.user?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={`font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${(typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : Number(transaction.amount)).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transaction.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Receipt className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{transaction.receipt_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {transaction.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div>
                          <div>{new Date(transaction.created_at).toLocaleDateString()}</div>
                          <div className="text-xs">
                            {new Date(transaction.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}