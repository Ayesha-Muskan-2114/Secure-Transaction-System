'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, Link, Hash, Clock, FileText } from 'lucide-react'

export default function Blockchain() {
  const router = useRouter()
  const [blocks, setBlocks] = useState([])
  const [expandedBlock, setExpandedBlock] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }
    fetchBlocks()
  }, [])

  const fetchBlocks = async () => {
    try {
      const res = await fetch('/api/blockchain/blocks')
      const data = await res.json()

      if (res.ok) {
        setBlocks(data.blocks || [])
      } else {
        toast.error('Failed to fetch blockchain')
      }
    } catch (error) {
      toast.error('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleBlock = (index) => {
    setExpandedBlock(expandedBlock === index ? null : index)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading blockchain...</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blockchain Explorer</h1>
              <p className="text-gray-600 mt-1">Browse all blocks in the chain</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Blocks</p>
              <p className="text-3xl font-bold text-blue-600">{blocks.length}</p>
            </div>
          </div>

          <div className="space-y-4">
            {blocks.length > 0 ? (
              blocks.map((block) => (
                <Card key={block.id} className="overflow-hidden">
                  <CardHeader className="cursor-pointer hover:bg-gray-50" onClick={() => toggleBlock(block.index)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Link className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Block #{block.index}</CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            {block.transactions?.length || 0} transaction{block.transactions?.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Created</p>
                          <p className="text-sm font-medium">{new Date(block.timestamp).toLocaleString()}</p>
                        </div>
                        {expandedBlock === block.index ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {expandedBlock === block.index && (
                    <CardContent className="border-t bg-gray-50 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <Hash className="w-4 h-4 text-gray-400 mt-1" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Block Hash</p>
                              <p className="text-xs font-mono text-gray-900 break-all">{block.hash}</p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-2">
                            <Hash className="w-4 h-4 text-gray-400 mt-1" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Previous Hash</p>
                              <p className="text-xs font-mono text-gray-900 break-all">{block.previous_hash}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <Hash className="w-4 h-4 text-gray-400 mt-1" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Merkle Root</p>
                              <p className="text-xs font-mono text-gray-900 break-all">{block.merkle_root}</p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-2">
                            <Clock className="w-4 h-4 text-gray-400 mt-1" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Timestamp</p>
                              <p className="text-xs text-gray-900">{new Date(block.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {block.transactions && block.transactions.length > 0 && (
                        <div className="pt-4 border-t">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            Transactions
                          </h4>
                          <div className="space-y-2">
                            {block.transactions.map((tx, idx) => (
                              <div key={idx} className="p-3 bg-white rounded border">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">TX: {tx.tx_id}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {tx.sender_account} → {tx.receiver_account}
                                    </p>
                                    {tx.remarks && <p className="text-xs text-gray-400 mt-1">{tx.remarks}</p>}
                                  </div>
                                  <p className="text-sm font-bold text-green-600">₹{tx.amount.toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No blocks in the blockchain yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
