'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Building2, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { setAuth } from '@/lib/auth';
import { toast } from 'sonner';

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mobile = searchParams.get('mobile');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (!mobile) {
      router.push('/register');
    }
  }, [mobile, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/vendor/verify-otp', {
        mobile,
        otp,
      });
      
      const { token, vendor } = response.data;
      setAuth(token, vendor);
      toast.success('Account verified successfully!');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'OTP verification failed.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 dark:from-purple-950 dark:via-violet-950 dark:to-purple-900 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gradient-to-br from-purple-600 to-violet-600 p-3">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            Verify OTP
          </CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to <br />
            <span className="font-semibold text-foreground">{mobile}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={loading}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Didn't receive the code? Check your spam folder or contact support.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}