'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Shield, Lock, Fingerprint } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Login state
  const [loginData, setLoginData] = useState({ mobile: '', pin: '' })

  // Register state
  const [registerData, setRegisterData] = useState({
    mobile: '',
    email: '',
    pin: '',
    name: '',
    account_number: '',
    branch: ''
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      })

      const data = await res.json()

      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        toast.success('Login successful!')
        router.push('/dashboard')
      } else {
        toast.error(data.detail || 'Login failed')
      }
    } catch (error) {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      })

      const data = await res.json()

      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        toast.success('Registration successful!')
        router.push('/dashboard')
      } else {
        toast.error(data.detail || 'Registration failed')
      }
    } catch (error) {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">

        {/* Branding Left */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-blue-900">ABC Secure Bank</h1>
              <p className="text-sm text-gray-600">Blockchain-Backed Banking</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Military-Grade Security</h3>
                <p className="text-sm text-gray-600">AES-256 encryption & blockchain ledger</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                <Fingerprint className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">FacePay Technology</h3>
                <p className="text-sm text-gray-600">Biometric payments with face recognition</p>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Login or create a new account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mobile Number</Label>
                    <Input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={loginData.mobile}
                      onChange={(e) => setLoginData({ ...loginData, mobile: e.target.value })}
                      maxLength={10}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>PIN</Label>
                    <Input
                      type="password"
                      placeholder="4-digit PIN"
                      value={loginData.pin}
                      onChange={(e) => setLoginData({ ...loginData, pin: e.target.value })}
                      maxLength={4}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </TabsContent>

              {/* Register */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      placeholder="Your full name"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Mobile Number</Label>
                    <Input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={registerData.mobile}
                      onChange={(e) => setRegisterData({ ...registerData, mobile: e.target.value })}
                      maxLength={10}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                      placeholder="Unique account number"
                      value={registerData.account_number}
                      onChange={(e) => setRegisterData({ ...registerData, account_number: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Input
                      placeholder="Branch name"
                      value={registerData.branch}
                      onChange={(e) => setRegisterData({ ...registerData, branch: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>PIN</Label>
                    <Input
                      type="password"
                      placeholder="4-digit PIN"
                      value={registerData.pin}
                      onChange={(e) => setRegisterData({ ...registerData, pin: e.target.value })}
                      maxLength={4}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>

            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
