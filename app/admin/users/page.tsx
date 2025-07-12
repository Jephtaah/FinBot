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
import { Users, Calendar, Activity } from 'lucide-react'

interface UserData {
  id: string
  email: string
  full_name: string | null
  monthly_income: number | null
  monthly_expense: number | null
  savings_goal: number | null
  created_at: string
  updated_at: string
  transaction_count?: number
  total_income?: number
  total_expenses?: number
}

async function getAllUsers(): Promise<UserData[]> {
  const supabase = await createClient()
  
  // Get all users with their profile data
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (!profiles) return []
  
  // Get transaction stats for each user
  const usersWithStats = await Promise.all(
    profiles.map(async (profile) => {
      // Get transaction count
      const { count: transactionCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
      
      // Get total income
      const { data: incomeData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', profile.id)
        .eq('type', 'income')
      
      // Get total expenses
      const { data: expenseData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', profile.id)
        .eq('type', 'expense')
      
      const totalIncome = incomeData?.reduce((sum, t) => {
        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount)
        return sum + amount
      }, 0) || 0
      const totalExpenses = expenseData?.reduce((sum, t) => {
        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount)
        return sum + amount
      }, 0) || 0
      
      return {
        ...profile,
        transaction_count: transactionCount || 0,
        total_income: totalIncome,
        total_expenses: totalExpenses
      }
    })
  )
  
  return usersWithStats
}

async function getUserStats() {
  const supabase = await createClient()
  
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
  
  const { count: activeUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // last 30 days
  
  const { count: newUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // last 7 days
  
  return {
    total: totalUsers || 0,
    active: activeUsers || 0,
    new: newUsers || 0
  }
}

export default async function AdminUsersPage() {
  const [users, stats] = await Promise.all([
    getAllUsers(),
    getUserStats()
  ])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage and view all registered users
        </p>
      </div>

      {/* User Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Active in last 30 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.new}</div>
            <p className="text-xs text-muted-foreground">
              Joined this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Complete list of registered users with their profile and transaction data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Total Income</TableHead>
                    <TableHead>Total Expenses</TableHead>
                    <TableHead>Monthly Budget</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const isActive = new Date(user.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    // const netWorth = (user.total_income || 0) - (user.total_expenses || 0)
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.full_name || 'Not set'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {user.transaction_count || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          ${(user.total_income || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          ${(user.total_expenses || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Income: ${(user.monthly_income || 0).toFixed(2)}</div>
                            <div>Expense: ${(user.monthly_expense || 0).toFixed(2)}</div>
                            <div>Goal: ${(user.savings_goal || 0).toFixed(2)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isActive ? "default" : "secondary"}>
                            {isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}