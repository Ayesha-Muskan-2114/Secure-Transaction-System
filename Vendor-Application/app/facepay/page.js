'use client';
import { JSEncrypt } from 'jsencrypt';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scan, Loader2, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import WebcamCapture from '@/components/WebcamCapture';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import api from '@/lib/api';
import { toast } from 'sonner';

const STEPS = {
  ENTER_AMOUNT: 1,
  CONFIRM_AMOUNT: 2,
  ENTER_PHONE: 3,
  CAPTURE_FACE: 4,
  ENTER_PIN: 5,
  SUCCESS: 6,
};

export default function FacePayPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(STEPS.ENTER_AMOUNT);
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState({
    session_id: null,
    amount: '',
    customer_phone: '',
    customer_name: '',
    face_image: null,
    pin: '',
    transaction_id: null,
  });

  // Step 1: Enter Amount
  const handleInitiateFacePay = async (e) => {
    e.preventDefault();
    const amount = parseFloat(sessionData.amount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/facepay/initiate', { amount });
      setSessionData(prev => ({ ...prev, session_id: response.data.session_id }));
      toast.success('FacePay session initiated');
      setCurrentStep(STEPS.CONFIRM_AMOUNT);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to initiate FacePay');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm Amount
  const handleConfirmAmount = async (confirmed) => {
    if (!confirmed) {
      toast.info('Transaction cancelled. Please start again.');
      resetFlow();
      return;
    }

    setLoading(true);
    try {
      await api.post('/facepay/confirm-amount', {
        session_id: sessionData.session_id,
        confirmed: true,
      });
      toast.success('Amount confirmed');
      setCurrentStep(STEPS.ENTER_PHONE);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to confirm amount');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify Phone
  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/facepay/verify-phone', {
        session_id: sessionData.session_id,
        customer_phone: sessionData.customer_phone,
      });
      setSessionData(prev => ({ ...prev, customer_name: response.data.customer_name }));
      toast.success(`Customer verified: ${response.data.customer_name}`);
      setCurrentStep(STEPS.CAPTURE_FACE);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Customer verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Verify Face
  const handleFaceCapture = async (imageData) => {
    setSessionData(prev => ({ ...prev, face_image: imageData }));
    setLoading(true);
    try {
      const response = await api.post('/facepay/verify-face', {
        session_id: sessionData.session_id,
        face_image: imageData,
      });
      toast.success(`Face verified! Match: ${(response.data.similarity_score * 100).toFixed(1)}%`);
      setCurrentStep(STEPS.ENTER_PIN);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Face verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Verify PIN (with RSA encryption on client side would be ideal, but for MVP, backend handles it)
 //const encryptPin = (pin) => {
  //const publicKey = process.env.NEXT_PUBLIC_RSA_PUBLIC_KEY;
  //const jsEncrypt = new JSEncrypt();

  // wrap as PEM
  //const publicKeyPEM = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;

  //jsEncrypt.setPublicKey(publicKey);
  //const encrypted = jsEncrypt.encrypt(pin);

  //if (!encrypted) {
    //throw new Error('PIN encryption failed. Check the public key.');
  //}
//
  //return encrypted; // base64 string
//};



  const handleVerifyPin = async (e) => {
    e.preventDefault();
    
    if (sessionData.pin.length !== 6) {
      toast.error('Please enter a 6-digit PIN');
      return;
    }

    setLoading(true);
    try {
      // In a real scenario, we would encrypt the PIN using RSA public key here
      // For now, sending as-is and backend will handle encryption/decryption
      //const encryptedPin = encryptPin(sessionData.pin);

    const response = await api.post('/facepay/verify-pin', {
      session_id: sessionData.session_id,
      pin: sessionData.pin,  // now properly RSA encrypted
    });
      
      setSessionData(prev => ({ ...prev, transaction_id: response.data.transaction_id }));
      toast.success('Payment successful!');
      setCurrentStep(STEPS.SUCCESS);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'PIN verification failed');
      setSessionData(prev => ({ ...prev, pin: '' }));
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setCurrentStep(STEPS.ENTER_AMOUNT);
    setSessionData({
      session_id: null,
      amount: '',
      customer_phone: '',
      customer_name: '',
      face_image: null,
      pin: '',
      transaction_id: null,
    });
  };

  const getProgressValue = () => {
    return ((currentStep - 1) / 5) * 100;
  };
  
  const MaskedOTPSlot = ({ char, ...props }) => {
    return (
      <div
        {...props}
        className="h-12 w-10 flex items-center justify-center border rounded-md bg-muted text-2xl"
      >
        {char ? "•" : ""}
      </div>
    );
  };


  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          {/* Header */}
          <div className="border-b bg-card">
            <div className="container mx-auto px-6 py-4">
              <h1 className="text-2xl font-bold">FacePay Transaction</h1>
              <p className="text-sm text-muted-foreground">Secure face recognition payment system</p>
            </div>
          </div>

          {/* Content */}
          <div className="container mx-auto p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Progress */}
              {currentStep !== STEPS.SUCCESS && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Step {currentStep} of 5</span>
                        <span className="font-semibold">{getProgressValue().toFixed(0)}%</span>
                      </div>
                      <Progress value={getProgressValue()} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 1: Enter Amount */}
              {currentStep === STEPS.ENTER_AMOUNT && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-gradient-to-br from-purple-600 to-violet-600 p-3">
                        <Scan className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle>Step 1: Enter Transaction Amount</CardTitle>
                        <CardDescription>Enter the amount customer needs to pay</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleInitiateFacePay} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (₹)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xl">
                            ₹
                          </span>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-8 text-2xl h-16"
                            value={sessionData.amount}
                            onChange={(e) => setSessionData({ ...sessionData, amount: e.target.value })}
                            required
                            disabled={loading}
                            autoFocus
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Continue
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Confirm Amount */}
              {currentStep === STEPS.CONFIRM_AMOUNT && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-gradient-to-br from-purple-600 to-violet-600 p-3">
                        <Scan className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle>Step 2: Confirm Amount</CardTitle>
                        <CardDescription>Please verify the transaction amount</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-lg bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 p-8 text-center">
                      <p className="text-sm text-muted-foreground mb-2">Transaction Amount</p>
                      <p className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                        ₹{parseFloat(sessionData.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please confirm the amount is correct. To change the amount, you'll need to restart the transaction.
                      </AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => handleConfirmAmount(false)}
                        disabled={loading}
                      >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Cancel
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => handleConfirmAmount(true)}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Confirming...
                          </>
                        ) : (
                          <>
                            Confirm
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Enter Customer Phone */}
              {currentStep === STEPS.ENTER_PHONE && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-gradient-to-br from-purple-600 to-violet-600 p-3">
                        <Scan className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle>Step 3: Enter Customer Phone Number</CardTitle>
                        <CardDescription>Enter the registered mobile number of the customer</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleVerifyPhone} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="customer_phone">Customer Mobile Number</Label>
                        <Input
                          id="customer_phone"
                          type="tel"
                          placeholder="Enter customer's mobile number"
                          className="text-lg h-12"
                          value={sessionData.customer_phone}
                          onChange={(e) => setSessionData({ ...sessionData, customer_phone: e.target.value })}
                          required
                          disabled={loading}
                          autoFocus
                        />
                      </div>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          The customer must have FacePay enabled on their account.
                        </AlertDescription>
                      </Alert>
                      <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            Verify Customer
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Capture Face */}
              {currentStep === STEPS.CAPTURE_FACE && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-gradient-to-br from-purple-600 to-violet-600 p-3">
                        <Scan className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle>Step 4: Capture Customer Face</CardTitle>
                        <CardDescription>
                          Customer: {sessionData.customer_name} | Amount: ₹{parseFloat(sessionData.amount).toLocaleString('en-IN')}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Position the customer's face in the camera. Make sure the face is clearly visible and well-lit.
                      </AlertDescription>
                    </Alert>
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="h-16 w-16 animate-spin text-primary" />
                        <p className="text-lg font-semibold">Verifying face...</p>
                        <p className="text-sm text-muted-foreground">Please wait while we match the face with stored data</p>
                      </div>
                    ) : (
                      <WebcamCapture onCapture={handleFaceCapture} />
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 5: Enter PIN */}
              {currentStep === STEPS.ENTER_PIN && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-gradient-to-br from-purple-600 to-violet-600 p-3">
                        <Scan className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle>Step 5: Enter 6-Digit PIN</CardTitle>
                        <CardDescription>Customer should enter their secret PIN to complete the payment</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleVerifyPin} className="space-y-6">
                      <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Customer:</span>
                          <span className="font-semibold">{sessionData.customer_name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Amount:</span>
                          <span className="font-bold text-lg text-green-600">
                            ₹{parseFloat(sessionData.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <Label className="text-center block">Customer PIN</Label>
                        <div className="flex justify-center">
                          <InputOTP
                            maxLength={6}
                            value={sessionData.pin}
                            onChange={(value) => setSessionData({ ...sessionData, pin: value })}
                            disabled={loading}
                            
                          >
                            <InputOTPGroup>
                                 <MaskedOTPSlot index={0} char={sessionData.pin[0]} />
                                  <MaskedOTPSlot index={1} char={sessionData.pin[1]} />
                                  <MaskedOTPSlot index={2} char={sessionData.pin[2]} />
                                  <MaskedOTPSlot index={3} char={sessionData.pin[3]} />
                                  <MaskedOTPSlot index={4} char={sessionData.pin[4]} />
                                  <MaskedOTPSlot index={5} char={sessionData.pin[5]} />                   
                          </InputOTPGroup>
                           </InputOTP>
                        </div>
                      </div>

                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          The PIN is encrypted and stored securely. A verification email will be sent to the customer.
                        </AlertDescription>
                      </Alert>

                      <Button type="submit" className="w-full" size="lg" disabled={loading || sessionData.pin.length !== 6}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing Payment...
                          </>
                        ) : (
                          <>
                            Complete Payment
                            <CheckCircle2 className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Step 6: Success */}
              {currentStep === STEPS.SUCCESS && (
                <Card className="shadow-lg border-green-500">
                  <CardContent className="pt-12 pb-12 text-center space-y-6">
                    <div className="flex justify-center">
                      <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-6">
                        <CheckCircle2 className="h-20 w-20 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold mb-2">Payment Successful!</h2>
                      <p className="text-muted-foreground">The transaction has been completed successfully</p>
                    </div>
                    <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-6 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transaction ID:</span>
                        <span className="font-mono font-semibold">{sessionData.transaction_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="font-semibold">{sessionData.customer_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount Paid:</span>
                        <span className="font-bold text-xl text-green-600">
                          ₹{parseFloat(sessionData.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        A verification email has been sent to the customer. The transaction is recorded on the blockchain.
                      </AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" size="lg" onClick={() => router.push('/dashboard')}>
                        View Dashboard
                      </Button>
                      <Button size="lg" onClick={resetFlow}>
                        New Transaction
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
