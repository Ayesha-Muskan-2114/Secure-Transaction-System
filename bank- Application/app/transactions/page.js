'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TrendingUp, TrendingDown, Search, Filter } from 'lucide-react'
import { toast } from 'sonner'

export default function Transactions() {
  const router = useRouter()
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userAccount, setUserAccount] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')

    if (!token) {
      router.push('/')
      return
    }

    const userData = JSON.parse(user)
    setUserAccount(userData.account_number)
    fetchTransactions(token)
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = transactions.filter(tx => 
        tx.tx_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.sender_account.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.receiver_account.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.remarks?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredTransactions(filtered)
    } else {
      setFilteredTransactions(transactions)
    }
  }, [searchQuery, transactions])

  const fetchTransactions = async (token) => {
    try {
      const res = await fetch('/api/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await res.json()

      if (res.ok) {
        setTransactions(data.transactions || [])
        setFilteredTransactions(data.transactions || [])
      } else {
        toast.error('Failed to fetch transactions')
      }
    } catch (error) {
      toast.error('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-gray-600 mt-1">View all your transactions</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length > 0 ? (
                <div className="space-y-3">
                  {filteredTransactions.map((tx) => {
                    const isSent = tx.sender_account === userAccount
                    return (
                      <div key={tx.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isSent ? 'bg-red-100' : 'bg-green-100'
                            }`}>
                              {isSent ? (
                                <TrendingDown className="w-5 h-5 text-red-600" />
                              ) : (
                                <TrendingUp className="w-5 h-5 text-green-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {isSent ? 'Sent to' : 'Received from'} {isSent ? tx.receiver_account : tx.sender_account}
                              </p>
                              <p className="text-sm text-gray-500">{tx.remarks || 'No remarks'}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                TX ID: {tx.tx_id} • {new Date(tx.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${
                              isSent ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {isSent ? '-' : '+'}₹{tx.amount.toLocaleString()}
                            </p>
                            <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No transactions found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
