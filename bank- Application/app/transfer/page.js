'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Send, ArrowRight } from 'lucide-react'

export default function Transfer() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [balance, setBalance] = useState(0)
  const [transferData, setTransferData] = useState({
    receiver_account: '',
    amount: '',
    remarks: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }
    fetchBalance(token)
  }, [])

  const fetchBalance = async (token) => {
    try {
      const res = await fetch('/api/user/balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setBalance(data.balance)
      }
    } catch (error) {
      console.error('Failed to fetch balance')
    }
  }

  const handleTransfer = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const token = localStorage.getItem('token')

    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver_account: transferData.receiver_account,
          amount: parseFloat(transferData.amount),
          remarks: transferData.remarks
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success(`Transfer successful! Sent ₹${transferData.amount} to ${data.receiver_name}`)
        setTransferData({ receiver_account: '', amount: '', remarks: '' })
        fetchBalance(token)
      } else {
        toast.error(data.detail || 'Transfer failed')
      }
    } catch (error) {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transfer Funds</h1>
            <p className="text-gray-600 mt-1">Send money securely to any account</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Transfer Details</CardTitle>
                <CardDescription>Enter recipient details and amount</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTransfer} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="receiver">Receiver Account Number</Label>
                    <Input
                      id="receiver"
                      type="text"
                      placeholder="Enter account number"
                      value={transferData.receiver_account}
                      onChange={(e) => setTransferData({ ...transferData, receiver_account: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="Enter amount"
                      value={transferData.amount}
                      onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks (Optional)</Label>
                    <Textarea
                      id="remarks"
                      placeholder="Add a note"
                      value={transferData.remarks}
                      onChange={(e) => setTransferData({ ...transferData, remarks: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    <Send className="w-5 h-5 mr-2" />
                    {isLoading ? 'Processing...' : 'Transfer Now'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Available Balance</p>
                  <p className="text-2xl font-bold text-green-600">₹{balance.toLocaleString()}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Transfer Fee</span>
                    <span className="font-medium text-gray-900">₹0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Processing Time</span>
                    <span className="font-medium text-gray-900">Instant</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    All transactions are logged on the blockchain for transparency and security.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
