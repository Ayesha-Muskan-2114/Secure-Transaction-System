'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Camera, Fingerprint, Shield, Lock, Power } from 'lucide-react'

export default function FacePay() {
  const router = useRouter()

  // -------------------------------
  // Register tab states
  // -------------------------------
  const regVideoRef = useRef(null)
  const regCanvasRef = useRef(null)
  const [regStream, setRegStream] = useState(null)
  const [isRegCameraActive, setIsRegCameraActive] = useState(false)
  const [regCapturedImage, setRegCapturedImage] = useState(null)
  const [facePayLimit, setFacePayLimit] = useState('')

  // ✅ FacePay enabled state (from backend)
  const [isFacePayEnabled, setIsFacePayEnabled] = useState(false)

  // ✅ PIN STATES
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [paymentPin, setPaymentPin] = useState('')

  // -------------------------------
  // Payment tab states
  // -------------------------------
  const payVideoRef = useRef(null)
  const payCanvasRef = useRef(null)
  const [payStream, setPayStream] = useState(null)
  const [isPayCameraActive, setIsPayCameraActive] = useState(false)
  const [payCapturedImage, setPayCapturedImage] = useState(null)
  const [paymentData, setPaymentData] = useState({
    receiver_account: '',
    amount: '',
    remarks: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [facePayStatus, setFacePayStatus] = useState(null)

  // -------------------------------
  // Load FacePay status on mount
  // -------------------------------
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }
    fetchFacePayStatus(token)

    return () => {
      stopCamera(regStream, setRegStream, setIsRegCameraActive)
      stopCamera(payStream, setPayStream, setIsPayCameraActive)
    }
  }, []) // eslint-disable-line

  const fetchFacePayStatus = async (token) => {
    try {
      const res = await fetch('/api/facepay/status', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setFacePayStatus(data)
        // backend returns is_active boolean
        setIsFacePayEnabled(Boolean(data.is_active))
      } else {
        // handle non-ok if needed
        setFacePayStatus(null)
        setIsFacePayEnabled(false)
      }
    } catch (error) {
      console.error('Failed to fetch FacePay status', error)
    }
  }

  // ✅ Toggle FacePay enable/disable
  const toggleFacePay = async () => {
    const token = localStorage.getItem('token')
    if (!token) return toast.error('Not authenticated')

    try {
      const newStatus = !isFacePayEnabled

      const res = await fetch('/api/facepay/toggle', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await res.json()

      if (res.ok) {
        setIsFacePayEnabled(data.is_active)
        fetchFacePayStatus(token)

        if (!data.is_active) {
          toast.warning("FacePay disabled. Re-register to enable again.")
        } else {
          toast.success("FacePay enabled!")
        }

      } else {
        toast.error(data.detail || 'Failed to toggle FacePay')
      }

    } catch (err) {
      toast.error("Network error")
      console.error(err)
    }
  }

  // -------------------------------
  // Camera helpers
  // -------------------------------
  const startCamera = async (videoRef, setStream, setIsCameraActive, setCapturedImage) => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) videoRef.current.srcObject = mediaStream
      setStream(mediaStream)
      setIsCameraActive(true)
      setCapturedImage(null)
    } catch {
      toast.error('Failed to access camera. Grant camera permissions.')
    }
  }

  const stopCamera = (stream, setStream, setIsCameraActive) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setIsCameraActive(false)
    }
  }

  const capturePhoto = (videoRef, canvasRef, setCapturedImage, stopFn) => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      const imageData = canvas.toDataURL('image/jpeg')
      setCapturedImage(imageData)
      stopFn()
    }
  }

  // -------------------------------
  // Register FacePay
  // -------------------------------
  const handleRegisterFace = async () => {
    if (!regCapturedImage || !facePayLimit || !pin || !confirmPin) {
      toast.error('Set limit, PIN and capture face')
      return
    }

    if (pin.length !== 6 || confirmPin.length !== 6) {
      toast.error('PIN must be 6 digits')
      return
    }

    if (pin !== confirmPin) {
      toast.error('PIN mismatch')
      return
    }

    setIsLoading(true)
    const token = localStorage.getItem('token')

    try {
      const res = await fetch('/api/facepay/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          image_base64: regCapturedImage,
          facepay_limit: parseFloat(facePayLimit),
          pin: pin
        })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success('FacePay registered successfully!')
        setRegCapturedImage(null)
        setFacePayLimit('')
        setPin('')
        setConfirmPin('')
        fetchFacePayStatus(token)
      } else {
        toast.error(data.detail || 'Registration failed')
      }
    } catch (err) {
      console.error(err)
      toast.error('Network error. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // -------------------------------
  // FacePay payment
  // -------------------------------
  const handleFacePayPayment = async () => {
    if (!isFacePayEnabled) {
      toast.error('FacePay is disabled. Please enable FacePay to make biometric payments.')
      return
    }

    if (!payCapturedImage || !paymentData.receiver_account || !paymentData.amount) {
      toast.error('Fill all fields and capture your face')
      return
    }

    if (paymentPin.length !== 6) {
      toast.error('PIN must be 6 digits')
      return
    }

    setIsLoading(true)
    const token = localStorage.getItem('token')

    try {
      const res = await fetch('/api/facepay/verify-and-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          image_base64: payCapturedImage,
          receiver_account: paymentData.receiver_account,
          amount: parseFloat(paymentData.amount),
          remarks: paymentData.remarks,
          pin: paymentPin
        })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(
          `FacePay successful! ₹${paymentData.amount} sent (Similarity: ${(data.similarity_score * 100).toFixed(1)}%)`
        )
        setPayCapturedImage(null)
        setPaymentData({ receiver_account: '', amount: '', remarks: '' })
        setPaymentPin('')
        fetchFacePayStatus(token)
      } else {
        toast.error(data.detail || 'Payment failed')
      }
    } catch (err) {
      console.error(err)
      toast.error('Network error. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // -------------------------------
  // JSX
  // -------------------------------
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FacePay</h1>
              <p className="text-gray-600 mt-1">Biometric payments with face recognition</p>
            </div>

            {/* Toggle Button shown only if user has registered face entry */}
            {facePayStatus?.registered ? (
              <Button
                onClick={toggleFacePay}
                variant={isFacePayEnabled ? 'destructive' : 'default'}
                className="flex items-center"
              >
                <Power className="w-4 h-4 mr-2" />
                {isFacePayEnabled ? 'Disable FacePay' : 'Enable FacePay'}
              </Button>
            ) : (
              <Button onClick={() => { /* go to register */ }} className="flex items-center">
                Register to Enable
              </Button>
            )}
          </div>

          {/* Status Card */}
          {facePayStatus && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <Fingerprint className="w-6 h-6 text-white" />
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">
                        {facePayStatus.registered ? 'FacePay Registered' : 'FacePay Not Registered'}
                      </p>
                      {facePayStatus.registered && (
                        <p className="text-sm text-gray-600">
                          Limit: ₹{facePayStatus.facepay_limit?.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Active Label */}
                  <div
                    className={`px-4 py-2 rounded-full ${
                      isFacePayEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {isFacePayEnabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="register" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="register">Register/Update</TabsTrigger>

              {isFacePayEnabled && (
                <TabsTrigger value="pay">Make Payment</TabsTrigger>
              )}
            </TabsList>

            {/* ------------------- Register Tab ------------------- */}
            <TabsContent value="register">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Capture Face</CardTitle>
                    <CardDescription>Position your face in the frame</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                      {!regCapturedImage ? (
                        <video ref={regVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      ) : (
                        <img src={regCapturedImage} alt="Captured" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <canvas ref={regCanvasRef} className="hidden" />

                    <div className="flex space-x-2">
                      {!isRegCameraActive && !regCapturedImage && (
                        <Button onClick={() => startCamera(regVideoRef, setRegStream, setIsRegCameraActive, setRegCapturedImage)}>
                          <Camera className="w-4 h-4 mr-2" /> Start Camera
                        </Button>
                      )}
                      {isRegCameraActive && (
                        <>
                          <Button
                            onClick={() =>
                              capturePhoto(regVideoRef, regCanvasRef, setRegCapturedImage, () =>
                                stopCamera(regStream, setRegStream, setIsRegCameraActive)
                              )
                            }
                          >
                            Capture Photo
                          </Button>
                          <Button onClick={() => stopCamera(regStream, setRegStream, setIsRegCameraActive)} variant="outline">
                            Cancel
                          </Button>
                        </>
                      )}
                      {regCapturedImage && (
                        <Button
                          onClick={() => {
                            setRegCapturedImage(null)
                            startCamera(regVideoRef, setRegStream, setIsRegCameraActive, setRegCapturedImage)
                          }}
                          variant="outline"
                        >
                          Retake
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Set FacePay Limit & PIN</CardTitle>
                    <CardDescription>Maximum amount + PIN security</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="limit">FacePay Limit (₹)</Label>
                      <Input
                        id="limit"
                        type="number"
                        placeholder="Enter limit"
                        value={facePayLimit}
                        onChange={(e) => setFacePayLimit(e.target.value)}
                        min="1"
                      />
                    </div>

                    {/* PIN input */}
                    <div className="space-y-2">
                      <Label>6 Digit PIN</Label>
                      <Input
                        type="password"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>

                    {/* Confirm PIN */}
                    <div className="space-y-2">
                      <Label>Confirm PIN</Label>
                      <Input
                        type="password"
                        maxLength={6}
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      />
                      {pin && confirmPin && pin !== confirmPin && (
                        <p className="text-red-500 text-xs">PINs do not match</p>
                      )}
                    </div>

                    <Button
                      onClick={handleRegisterFace}
                      className="w-full"
                      size="lg"
                      disabled={!regCapturedImage || !facePayLimit || !pin || !confirmPin || pin !== confirmPin || isLoading}
                    >
                      {isLoading ? 'Saving...' : (facePayStatus?.registered ? 'Update FacePay' : 'Register FacePay')}
                    </Button>

                    {/* ✅ Warning when disabled */}
                    {!isFacePayEnabled && facePayStatus?.registered && (
                      <p className="text-xs text-gray-500 mt-2">
                        FacePay disabled — re-register in Register/Update tab
                      </p>
                    )}

                    <div className="pt-4 border-t space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span>AES-256 encrypted storage</span>
                      </div>
                      <p>Your face data & PIN are encrypted.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ------------------- Payment Tab ------------------- */}
            <TabsContent value="pay">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Verify Face</CardTitle>
                    <CardDescription>Capture your face for verification</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                      {!payCapturedImage ? (
                        <video ref={payVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      ) : (
                        <img src={payCapturedImage} alt="Captured" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <canvas ref={payCanvasRef} className="hidden" />

                    <div className="flex space-x-2">
                      {!isPayCameraActive && !payCapturedImage && (
                        <Button
                          onClick={() => startCamera(payVideoRef, setPayStream, setIsPayCameraActive, setPayCapturedImage)}
                        >
                          <Camera className="w-4 h-4 mr-2" /> Start Camera
                        </Button>
                      )}
                      {isPayCameraActive && (
                        <>
                          <Button
                            onClick={() =>
                              capturePhoto(payVideoRef, payCanvasRef, setPayCapturedImage, () =>
                                stopCamera(payStream, setPayStream, setIsPayCameraActive)
                              )
                            }
                          >
                            Capture Face
                          </Button>
                          <Button onClick={() => stopCamera(payStream, setPayStream, setIsPayCameraActive)} variant="outline">
                            Cancel
                          </Button>
                        </>
                      )}
                      {payCapturedImage && (
                        <Button
                          onClick={() => {
                            setPayCapturedImage(null)
                            startCamera(payVideoRef, setPayStream, setIsPayCameraActive, setPayCapturedImage)
                          }}
                          variant="outline"
                        >
                          Retake
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Details</CardTitle>
                    <CardDescription>Enter transaction details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pay-receiver">Receiver Account</Label>
                      <Input
                        id="pay-receiver"
                        type="text"
                        placeholder="Account number"
                        value={paymentData.receiver_account}
                        onChange={(e) =>
                          setPaymentData({ ...paymentData, receiver_account: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pay-amount">Amount (₹)</Label>
                      <Input
                        id="pay-amount"
                        type="number"
                        placeholder="Enter amount"
                        value={paymentData.amount}
                        onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                        min="1"
                      />
                      {facePayStatus?.registered && (
                        <p className="text-xs text-gray-500">
                          Max: ₹{facePayStatus.facepay_limit?.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pay-pin">FacePay PIN</Label>
                      <Input
                        id="pay-pin"
                        type="password"
                        placeholder="Enter your 6-digit PIN"
                        maxLength={6}
                        value={paymentPin}
                        onChange={(e) => setPaymentPin(e.target.value.replace(/\D/g, ''))}
                      />
                      {paymentPin && paymentPin.length !== 6 && (
                        <p className="text-red-500 text-xs">PIN must be 6 digits</p>
                      )}

                      <p className="text-xs text-gray-500">PIN required for FacePay transactions</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pay-remarks">Remarks</Label>
                      <Input
                        id="pay-remarks"
                        type="text"
                        placeholder="Optional"
                        value={paymentData.remarks}
                        onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                      />
                    </div>

                    <Button
                      onClick={handleFacePayPayment}
                      className="w-full"
                      size="lg"
                      disabled={
                        !payCapturedImage ||
                        !paymentData.receiver_account ||
                        !paymentData.amount ||
                        paymentPin.length !== 6 ||
                        isLoading ||
                        !isFacePayEnabled
                      }
                    >
                      {isLoading ? 'Verifying...' : 'Verify & Pay'}
                    </Button>

                    {!isFacePayEnabled && facePayStatus?.registered && (
                      <p className="text-sm text-orange-600 mt-1">
                        FacePay disabled — please re-register in Register/Update tab
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
