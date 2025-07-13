import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionCard } from '@/components/transaction-card'
import { TrendingUp, TrendingDown, Wallet, Receipt } from 'lucide-react'
import { getUserTransactions, getTransactionStats, getTransactionChartData, getCategoryChartData } from '@/lib/actions/transactions'
import { FinancialTrendsChart, CategoryChart } from '@/components/charts'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get recent transactions, stats, and chart data
  const [allTransactions, stats, chartData, categoryData] = await Promise.all([
    getUserTransactions(),
    getTransactionStats(),
    getTransactionChartData(),
    getCategoryChartData()
  ])
  
  // Show only the 5 most recent transactions
  const recentTransactions = allTransactions.slice(0, 5)
  
  // Calculate net income (income - expenses)
  const netIncome = stats.totalIncome - stats.totalExpenses

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}! Here&apos;s your financial overview.
        </p>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Balance</CardTitle>
            <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className={`text-lg sm:text-xl lg:text-2xl font-bold truncate ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(netIncome).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
            <p className="text-xs text-muted-foreground">
              {netIncome >= 0 ? 'Net positive' : 'Net negative'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Income</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 truncate">
              ${stats.totalIncome.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Expenses</CardTitle>
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 truncate">
              ${stats.totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Transactions</CardTitle>
            <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 xl:grid-cols-2">
        <FinancialTrendsChart data={chartData} />
        <CategoryChart data={categoryData} />
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base md:text-lg">Recent Transactions</CardTitle>
          <CardDescription className="text-sm">
            Your latest financial activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-6 md:py-8">
              <Receipt className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm md:text-base text-muted-foreground">No transactions yet</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Start by adding your first transaction to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {recentTransactions.map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
              {allTransactions.length > 5 && (
                <div className="text-center pt-3 md:pt-4">
                  <Link 
                    href="/dashboard/transactions" 
                    className="text-xs md:text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View all {allTransactions.length} transactions →
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 