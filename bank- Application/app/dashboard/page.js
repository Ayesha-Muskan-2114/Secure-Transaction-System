'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, Building, Phone, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token) {
      router.push('/')
      return
    }

    setUser(JSON.parse(userData))
    fetchDashboard(token)
  }, [])

  const fetchDashboard = async (token) => {
    try {
      const res = await fetch('/api/user/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await res.json()

      if (res.ok) {
        setDashboardData(data)
      } else {
        toast.error('Failed to fetch dashboard data')
      }
    } catch (error) {
      toast.error('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {dashboardData?.user?.name || 'User'}</h1>
            <p className="text-gray-600 mt-1">Here's your account overview</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Account Balance</CardTitle>
                <DollarSign className="w-5 h-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  ₹{dashboardData?.user?.balance?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-gray-500 mt-1">Available balance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Account Number</CardTitle>
                <Building className="w-5 h-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{dashboardData?.user?.account_number}</div>
                <p className="text-xs text-gray-500 mt-1">{dashboardData?.user?.branch}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Mobile Number</CardTitle>
                <Phone className="w-5 h-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{dashboardData?.user?.mobile}</div>
                <p className="text-xs text-gray-500 mt-1">Registered mobile</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Last Login</CardTitle>
                <Calendar className="w-5 h-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold text-gray-900">
                  {dashboardData?.user?.last_login ? new Date(dashboardData.user.last_login).toLocaleDateString() : 'N/A'}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {dashboardData?.user?.last_login ? new Date(dashboardData.user.last_login).toLocaleTimeString() : ''}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.recent_transactions?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recent_transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {tx.sender_account === dashboardData.user.account_number ? (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        ) : (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {tx.sender_account === dashboardData.user.account_number ? 'Sent to' : 'Received from'}{' '}
                            {tx.sender_account === dashboardData.user.account_number ? tx.receiver_account : tx.sender_account}
                          </p>
                          <p className="text-sm text-gray-500">{tx.remarks || 'No remarks'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.sender_account === dashboardData.user.account_number ? 'text-red-600' : 'text-green-600'}`}>
                          {tx.sender_account === dashboardData.user.account_number ? '-' : '+'}₹{tx.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No transactions yet</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button onClick={() => router.push('/transfer')} className="h-20 text-lg" size="lg">
              Transfer Funds
            </Button>
            <Button onClick={() => router.push('/facepay')} variant="outline" className="h-20 text-lg" size="lg">
              FacePay
            </Button>
            <Button onClick={() => router.push('/blockchain')} variant="outline" className="h-20 text-lg" size="lg">
              View Blockchain
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
