'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle, XCircle, AlertTriangle, Shield } from 'lucide-react'

export default function Validator() {
  const router = useRouter()
  const [validationResult, setValidationResult] = useState(null)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }
  }, [])

  const validateBlockchain = async () => {
    setIsValidating(true)
    try {
      const res = await fetch('/api/blockchain/validate')
      const data = await res.json()

      if (res.ok) {
        setValidationResult(data)
        if (data.valid) {
          toast.success('Blockchain is valid and intact!')
        } else {
          toast.error('Blockchain integrity compromised!')
        }
      } else {
        toast.error('Validation failed')
      }
    } catch (error) {
      toast.error('Network error')
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Blockchain Validator</h1>
            <p className="text-gray-600 mt-1">Verify the integrity of the blockchain</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Integrity Check</CardTitle>
              <CardDescription>
                This tool validates the entire blockchain by verifying:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>SHA-256 hash calculations</li>
                  <li>Merkle root integrity</li>
                  <li>Block linkage (previous hash references)</li>
                  <li>Tampering detection</li>
                </ul>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={validateBlockchain}
                size="lg"
                className="w-full md:w-auto"
                disabled={isValidating}
              >
                <Shield className="w-5 h-5 mr-2" />
                {isValidating ? 'Validating...' : 'Validate Blockchain'}
              </Button>
            </CardContent>
          </Card>

          {validationResult && (
            <>
              <Card className={validationResult.valid ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    {validationResult.valid ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-600" />
                    )}
                    <div>
                      <CardTitle className={validationResult.valid ? 'text-green-900' : 'text-red-900'}>
                        {validationResult.valid ? 'Blockchain is Valid' : 'Blockchain Integrity Compromised'}
                      </CardTitle>
                      <CardDescription className={validationResult.valid ? 'text-green-700' : 'text-red-700'}>
                        {validationResult.blocks_checked} block{validationResult.blocks_checked !== 1 ? 's' : ''} checked
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {validationResult.results && (
                <Card>
                  <CardHeader>
                    <CardTitle>Validation Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {validationResult.results.map((result) => (
                        <div
                          key={result.index}
                          className={`p-4 rounded-lg border ${
                            result.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {result.valid ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                              )}
                              <div>
                                <p className={`font-semibold ${
                                  result.valid ? 'text-green-900' : 'text-red-900'
                                }`}>
                                  Block #{result.index}
                                </p>
                                <div className="flex items-center space-x-4 mt-1 text-xs">
                                  <span className={result.hash_valid ? 'text-green-600' : 'text-red-600'}>
                                    Hash: {result.hash_valid ? '✓' : '✗'}
                                  </span>
                                  <span className={result.merkle_valid ? 'text-green-600' : 'text-red-600'}>
                                    Merkle: {result.merkle_valid ? '✓' : '✗'}
                                  </span>
                                  <span className={result.link_valid ? 'text-green-600' : 'text-red-600'}>
                                    Link: {result.link_valid ? '✓' : '✗'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded text-xs font-medium ${
                              result.valid ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                            }`}>
                              {result.valid ? 'VALID' : 'INVALID'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!validationResult && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Click "Validate Blockchain" to check integrity</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
