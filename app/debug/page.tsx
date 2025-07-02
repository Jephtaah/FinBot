import { debugListAllTransactions } from '@/lib/actions/transactions'
import { createClient } from '@/lib/supabase/server'

type DebugTransaction = {
  id: string
  title: string
  slug: string
  user_id: string
}

export default async function DebugPage() {
  console.log('=== DEBUG PAGE STARTING ===')
  
  try {
    // Test Supabase connection
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    console.log('Current user:', user?.id)
    console.log('User email:', user?.email)
    
    // Get all transactions
    const transactions = await debugListAllTransactions()
    
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug Information</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">User Info</h2>
            <p>User ID: {user?.id || 'Not logged in'}</p>
            <p>Email: {user?.email || 'No email'}</p>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold">Transactions ({transactions.length})</h2>
            {transactions.length === 0 ? (
              <p>No transactions found</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction: DebugTransaction) => (
                  <div key={transaction.id} className="border p-2 rounded">
                    <p><strong>Title:</strong> {transaction.title}</p>
                    <p><strong>Slug:</strong> {transaction.slug}</p>
                    <p><strong>ID:</strong> {transaction.id}</p>
                    <p><strong>User ID:</strong> {transaction.user_id}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Debug page error:', error)
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug Error</h1>
        <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }
} 