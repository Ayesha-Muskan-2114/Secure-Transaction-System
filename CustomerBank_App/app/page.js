'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Camera, Check, X, AlertCircle, Loader2, Shield, DollarSign, CreditCard, Database, CheckCircle } from 'lucide-react'

const API_URL = '/api/backend'

export default function ABCSecureBank() {
  const [showSetup, setShowSetup] = useState(false)
  const [currentView, setCurrentView] = useState('login')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [facepayStatus, setFacepayStatus] = useState(null)
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  
  const [regForm, setRegForm] = useState({ mobile: '', pin: '', name: '', account_number: '', branch: '', initial_balance: '10000' })
  const [loginForm, setLoginForm] = useState({ mobile: '', pin: '' })
  const [transferForm, setTransferForm] = useState({ to_account: '', amount: '', remarks: '' })
  const [paymentLimit, setPaymentLimit] = useState('5000')
  const [isCapturing, setIsCapturing] = useState(false)
  const [imageData, setImageData] = useState(null)
  const [verificationResult, setVerificationResult] = useState(null)
  const [transactions, setTransactions] = useState([])
  
  const showMessage = (text, type = 'info') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 5000)
  }
  
  useEffect(() => {
    if (user) {
      checkFacepayStatus()
    }
  }, [user])
  
  const checkFacepayStatus = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`${API_URL}/api/face/status/${user.id}`)
      const data = await response.json()
      if (data.success) {
        setFacepayStatus(data)
      }
    } catch (error) {
      console.error('Error checking FacePay status:', error)
    }
  }
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
      setIsCapturing(true)
    } catch (error) {
      showMessage('Camera access denied or unavailable', 'error')
    }
  }
  
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCapturing(false)
  }
  
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      
      const base64Image = canvas.toDataURL('image/jpeg', 0.8)
      setImageData(base64Image)
      stopCamera()
    }
  }
  
  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...regForm,
          initial_balance: parseFloat(regForm.initial_balance)
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        showMessage('Registration successful! Please login.', 'success')
        setCurrentView('login')
        setRegForm({ mobile: '', pin: '', name: '', account_number: '', branch: '', initial_balance: '10000' })
      } else {
        showMessage(data.detail || 'Registration failed', 'error')
      }
    } catch (error) {
      showMessage('Connection error: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }
  
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setUser(data.user)
        showMessage('Login successful!', 'success')
        setCurrentView('dashboard')
        setLoginForm({ mobile: '', pin: '' })
      } else {
        showMessage(data.detail || 'Login failed', 'error')
      }
    } catch (error) {
      showMessage('Connection error: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }
  
  const handleLogout = () => {
    setUser(null)
    setCurrentView('login')
    setFacepayStatus(null)
    showMessage('Logged out successfully', 'info')
  }
  
  const registerFace = async () => {
    if (!imageData || !user) return
    
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/face/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          image_base64: imageData,
          payment_limit: parseFloat(paymentLimit)
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        showMessage('FacePay registered successfully!', 'success')
        setImageData(null)
        checkFacepayStatus()
      } else {
        showMessage(data.detail || 'Face registration failed', 'error')
      }
    } catch (error) {
      showMessage('Error registering face: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }
  
  const verifyFace = async () => {
    if (!imageData || !user) return
    
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/face/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          image_base64: imageData
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setVerificationResult(data)
        showMessage(data.message, data.is_match ? 'success' : 'error')
        setImageData(null)
      } else {
        showMessage(data.detail || 'Face verification failed', 'error')
      }
    } catch (error) {
      showMessage('Error verifying face: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }
  
  const handleTransfer = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch(`${API_URL}/api/transactions/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_account: user.account_number,
          to_account: transferForm.to_account,
          amount: parseFloat(transferForm.amount),
          remarks: transferForm.remarks
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        showMessage(`Transfer successful! New balance: ₹${data.new_balance}`, 'success')
        setUser({ ...user, balance: data.new_balance })
        setTransferForm({ to_account: '', amount: '', remarks: '' })
        loadTransactions()
      } else {
        showMessage(data.detail || 'Transfer failed', 'error')
      }
    } catch (error) {
      showMessage('Transfer error: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }
  
  const loadTransactions = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`${API_URL}/api/transactions/history/${user.account_number}`)
      const data = await response.json()
      
      if (response.ok) {
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
    }
  }
  
  useEffect(() => {
    if (user && currentView === 'dashboard') {
      loadTransactions()
    }
  }, [user, currentView])
  
  if (showSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              Database Setup - SQL to Run
            </CardTitle>
            <CardDescription>
              Copy this SQL and run it in your Supabase SQL Editor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <strong>Step 1:</strong> Go to <a href="https://supabase.com/dashboard/project/fxivvquwvxpokwrijyaj/sql/new" target="_blank" className="text-blue-600 underline font-medium">Supabase SQL Editor</a>
                <br />
                <strong>Step 2:</strong> Copy SQL below, paste and click "Run"
                <br />
                <strong>Step 3:</strong> Click "Continue to App" button below
              </AlertDescription>
            </Alert>
            
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-h-96">
              <pre className="text-xs">{`-- ABC Secure Bank Database Schema

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile VARCHAR(15) UNIQUE NOT NULL,
    pin_hash TEXT NOT NULL,
    name VARCHAR(100) NOT NULL,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    branch VARCHAR(100) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS face_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    encrypted_embedding TEXT NOT NULL,
    payment_limit DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    sender_account VARCHAR(20) NOT NULL,
    receiver_account VARCHAR(20) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    remarks TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_account ON users(account_number);
CREATE INDEX IF NOT EXISTS idx_face_data_user ON face_data(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON transactions(receiver_id);`}</pre>
            </div>
            
            <Button onClick={() => setShowSetup(false)} className="w-full" size="lg">
              ✅ I've Created the Tables - Continue to App
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (currentView === 'login' || currentView === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-blue-900">ABC Secure Bank</CardTitle>
            <CardDescription>Secure Banking with FacePay Technology</CardDescription>
          </CardHeader>
          
          <CardContent>
            {message && (
              <Alert className={`mb-4 ${message.type === 'success' ? 'bg-green-50 border-green-200' : message.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}
            
            <Tabs value={currentView} onValueChange={setCurrentView}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-mobile">Mobile Number</Label>
                    <Input
                      id="login-mobile"
                      type="text"
                      placeholder="10-digit mobile number"
                      value={loginForm.mobile}
                      onChange={(e) => setLoginForm({ ...loginForm, mobile: e.target.value })}
                      required
                      maxLength={10}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-pin">4-Digit PIN</Label>
                    <Input
                      id="login-pin"
                      type="password"
                      placeholder="Enter your PIN"
                      value={loginForm.pin}
                      onChange={(e) => setLoginForm({ ...loginForm, pin: e.target.value })}
                      required
                      maxLength={4}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...</> : 'Login'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <Input
                      id="reg-name"
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-mobile">Mobile Number</Label>
                    <Input
                      id="reg-mobile"
                      type="text"
                      maxLength={10}
                      value={regForm.mobile}
                      onChange={(e) => setRegForm({ ...regForm, mobile: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-pin">4-Digit PIN</Label>
                    <Input
                      id="reg-pin"
                      type="password"
                      maxLength={4}
                      value={regForm.pin}
                      onChange={(e) => setRegForm({ ...regForm, pin: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-account">Account Number</Label>
                    <Input
                      id="reg-account"
                      value={regForm.account_number}
                      onChange={(e) => setRegForm({ ...regForm, account_number: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-branch">Branch Name</Label>
                    <Input
                      id="reg-branch"
                      value={regForm.branch}
                      onChange={(e) => setRegForm({ ...regForm, branch: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-balance">Initial Balance (₹)</Label>
                    <Input
                      id="reg-balance"
                      type="number"
                      value={regForm.initial_balance}
                      onChange={(e) => setRegForm({ ...regForm, initial_balance: e.target.value })}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</> : 'Register'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-4 text-center">
              <Button variant="ghost" size="sm" onClick={() => setShowSetup(true)}>
                View Setup Instructions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-blue-900">ABC Secure Bank</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
      </div>
      
      {message && (
        <div className="container mx-auto px-4 mt-4">
          <Alert className={`${message.type === 'success' ? 'bg-green-50 border-green-200' : message.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Account Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">₹{user?.balance?.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Account Number</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-700">{user?.account_number}</div>
              <p className="text-sm text-gray-500 mt-1">{user?.branch}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">FacePay Status</CardTitle>
            </CardHeader>
            <CardContent>
              {facepayStatus?.registered ? (
                <div>
                  <Badge className="bg-green-500">Active</Badge>
                  <p className="text-sm mt-2 text-gray-600">Limit: ₹{facepayStatus.payment_limit}</p>
                </div>
              ) : (
                <Badge variant="secondary">Not Registered</Badge>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="facepay" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="facepay">
              <Camera className="h-4 w-4 mr-2" />
              FacePay
            </TabsTrigger>
            <TabsTrigger value="transfer">
              <DollarSign className="h-4 w-4 mr-2" />
              Transfer
            </TabsTrigger>
            <TabsTrigger value="history">
              <CreditCard className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="facepay">
            <Card>
              <CardHeader>
                <CardTitle>FacePay Registration & Verification</CardTitle>
                <CardDescription>
                  Register your face for secure emergency payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Register Face</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="payment-limit">Payment Limit (₹)</Label>
                      <Input
                        id="payment-limit"
                        type="number"
                        value={paymentLimit}
                        onChange={(e) => setPaymentLimit(e.target.value)}
                        placeholder="5000"
                      />
                    </div>
                    
                    {!isCapturing && !imageData && (
                      <Button onClick={startCamera} className="w-full">
                        <Camera className="mr-2 h-4 w-4" />
                        Start Camera
                      </Button>
                    )}
                    
                    {isCapturing && (
                      <div className="space-y-2">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full rounded-lg border"
                        />
                        <div className="flex gap-2">
                          <Button onClick={captureImage} className="flex-1">Capture</Button>
                          <Button onClick={stopCamera} variant="outline" className="flex-1">Cancel</Button>
                        </div>
                      </div>
                    )}
                    
                    {imageData && (
                      <div className="space-y-2">
                        <img src={imageData} alt="Captured" className="w-full rounded-lg border" />
                        <div className="flex gap-2">
                          <Button onClick={registerFace} className="flex-1" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Register Face
                          </Button>
                          <Button onClick={() => { setImageData(null); startCamera() }} variant="outline" className="flex-1">
                            Retake
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Verify Face</h3>
                    
                    {!facepayStatus?.registered && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Please register your face first before verification.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {facepayStatus?.registered && !isCapturing && !imageData && (
                      <Button onClick={startCamera} className="w-full">
                        <Camera className="mr-2 h-4 w-4" />
                        Start Verification
                      </Button>
                    )}
                    
                    {facepayStatus?.registered && imageData && (
                      <div className="space-y-2">
                        <img src={imageData} alt="Verify" className="w-full rounded-lg border" />
                        <div className="flex gap-2">
                          <Button onClick={verifyFace} className="flex-1" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Verify Face
                          </Button>
                          <Button onClick={() => { setImageData(null); setVerificationResult(null); startCamera() }} variant="outline" className="flex-1">
                            Retake
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {verificationResult && (
                      <Card className={verificationResult.is_match ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            {verificationResult.is_match ? (
                              <Check className="h-8 w-8 text-green-600" />
                            ) : (
                              <X className="h-8 w-8 text-red-600" />
                            )}
                            <div>
                              <p className="font-semibold">
                                {verificationResult.is_match ? 'Verification Successful!' : 'Verification Failed'}
                              </p>
                              <p className="text-sm text-gray-600">
                                Confidence: {(verificationResult.confidence * 100).toFixed(2)}%
                              </p>
                              {verificationResult.is_match && (
                                <p className="text-sm text-gray-600">
                                  Payment Limit: ₹{verificationResult.payment_limit}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transfer">
            <Card>
              <CardHeader>
                <CardTitle>Transfer Funds</CardTitle>
                <CardDescription>Send money to another account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="to-account">Receiver Account Number</Label>
                    <Input
                      id="to-account"
                      value={transferForm.to_account}
                      onChange={(e) => setTransferForm({ ...transferForm, to_account: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks (Optional)</Label>
                    <Input
                      id="remarks"
                      value={transferForm.remarks}
                      onChange={(e) => setTransferForm({ ...transferForm, remarks: e.target.value })}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Transfer Funds'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your recent transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No transactions yet</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((txn) => (
                      <div key={txn.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {txn.sender_account === user?.account_number ? 'To: ' : 'From: '}
                            {txn.sender_account === user?.account_number ? txn.receiver_account : txn.sender_account}
                          </p>
                          <p className="text-sm text-gray-500">{txn.remarks || 'No remarks'}</p>
                          <p className="text-xs text-gray-400">{new Date(txn.created_at).toLocaleString()}</p>
                        </div>
                        <div className={`text-lg font-bold ${txn.sender_account === user?.account_number ? 'text-red-600' : 'text-green-600'}`}>
                          {txn.sender_account === user?.account_number ? '-' : '+'}₹{txn.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
