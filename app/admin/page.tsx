import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CreditCard, Receipt, TrendingUp, DollarSign, Activity } from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalTransactions: number
  totalReceipts: number
  totalRevenue: number
  avgTransactionAmount: number
  recentUsers: number
}

async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient()
  
  // Get total users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
  
  // Get total transactions
  const { count: totalTransactions } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
  
  // Get total receipts
  const { count: totalReceipts } = await supabase
    .from('receipt_images')
    .select('*', { count: 'exact', head: true })
  
  // Get total revenue (sum of all income transactions)
  const { data: revenueData } = await supabase
    .from('transactions')
    .select('amount')
    .eq('type', 'income')
  
  const totalRevenue = revenueData?.reduce((sum, t) => {
    const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount)
    return sum + amount
  }, 0) || 0
  
  // Get average transaction amount
  const { data: allTransactions } = await supabase
    .from('transactions')
    .select('amount')
  
  const avgTransactionAmount = allTransactions?.length 
    ? allTransactions.reduce((sum, t) => {
        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount)
        return sum + amount
      }, 0) / allTransactions.length
    : 0
  
  // Get recent users (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { count: recentUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString())
  
  return {
    totalUsers: totalUsers || 0,
    totalTransactions: totalTransactions || 0,
    totalReceipts: totalReceipts || 0,
    totalRevenue,
    avgTransactionAmount,
    recentUsers: recentUsers || 0
  }
}

async function getRecentActivity() {
  const supabase = await createClient()
  
  // Get recent transactions with user info
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select(`
      id,
      title,
      amount,
      type,
      created_at,
      user_id,
      profiles!inner(email, full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(5)
  
  // Get recent user signups
  const { data: recentSignups } = await supabase
    .from('profiles')
    .select('email, full_name, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  
  return {
    recentTransactions: recentTransactions || [],
    recentSignups: recentSignups || []
  }
}

export default async function AdminPage() {
  const [stats, activity] = await Promise.all([
    getAdminStats(),
    getRecentActivity()
  ])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of system-wide analytics and user activity
        </p>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.recentUsers} new this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Across all users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReceipts}</div>
            <p className="text-xs text-muted-foreground">
              Receipt images uploaded
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              All income transactions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.avgTransactionAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average amount per transaction
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Latest transactions across all users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activity.recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activity.recentTransactions.map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between border-b pb-2">
                    <div className="flex-1">
                      <p className="font-medium">{transaction.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.profiles?.full_name || transaction.profiles?.email || 'Unknown User'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${(typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : Number(transaction.amount)).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent User Signups */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
            <CardDescription>
              New users who joined recently
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activity.recentSignups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No recent signups</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activity.recentSignups.map((user: any, index: number) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2">
                    <div className="flex-1">
                      <p className="font-medium">{user.full_name || 'Name not set'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}