import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionCard } from '@/components/transaction-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Filter } from 'lucide-react'
import { getUserTransactions, getTransactionStats } from '@/lib/actions/transactions'

export default async function TransactionsPage() {
  // Fetch real data from the database
  const [transactions, stats] = await Promise.all([
    getUserTransactions(),
    getTransactionStats()
  ])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Manage your income and expenses
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/transactions/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${stats.totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            View and manage your transaction history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search transactions..." 
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
          
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No transactions yet</p>
                <p className="text-sm">Start by adding your first transaction</p>
              </div>
              <Button asChild>
                <Link href="/dashboard/transactions/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Transaction
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <TransactionCard 
                  key={transaction.id} 
                  transaction={transaction} 
                  showActions={true}
                  clickable={true}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 