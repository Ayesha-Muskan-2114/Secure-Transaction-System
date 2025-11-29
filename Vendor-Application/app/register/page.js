'use client';
import Image from "next/image";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    account_number: '',
    branch: '',
    pin: '',
    confirm_pin: '',
    initial_balance: '0',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.pin !== formData.confirm_pin) {
      toast.error('PINs do not match');
      return;
    }

    if (formData.pin.length < 4) {
      toast.error('PIN must be at least 4 digits');
      return;
    }

    setLoading(true);

    try {
      const { confirm_pin, ...registerData } = formData;
      const response = await api.post('/vendor/register', {
        ...registerData,
        initial_balance: parseFloat(registerData.initial_balance) || 0,
      });
      
      toast.success('Registration successful! Please check your email for OTP.');
      router.push(`/verify-otp?mobile=${formData.mobile}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
  <div
    className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
    style={{ backgroundImage: "url('/images/bg.png')" }}
  >
    {/* Dark overlay for contrast */}
    <div className="absolute inset-0 bg-black/40"></div>

    {/* Registration Card */}
    <div className="relative z-10 w-full max-w-2xl p-4">
      <Card className="w-full my-8 shadow-2xl 
        bg-white/10 backdrop-blur-xl 
        border border-white/20 rounded-2xl">
        
        <CardHeader className="space-y-1 text-center">
           <div className="flex justify-center">
                        <Image
                          src="/images/logo.png"
                          alt="NammaPay Logo"
                          width={150}
                          height={70}
                          className="rounded-xl shadow-lg"
                          priority
                        />
                      </div>

     {/**    <CardTitle className="text-3xl font-bold text-white text-center">
   ನಮ್ಮPay  
</CardTitle> */} 


          <CardDescription className="text-white/80">
            Create your vendor account to get started
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Full Name *</Label>
                <Input
                className="text-white placeholder-white/70"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Mobile Number *</Label>
                <Input
                className="text-white placeholder-white/70"
                  type="tel"
                  placeholder="9876543210"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Email Address *</Label>
              <Input
              className="text-white placeholder-white/70"
                type="email"
                placeholder="vendor@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Account Number *</Label>
                <Input
                className="text-white placeholder-white/70"
                  placeholder="1234567890"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Branch *</Label>
                <Input
                className="text-white placeholder-white/70"
                  placeholder="Main Branch"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
            </div>
{/** 
            <div className="space-y-2">
              <Label className="text-white">Initial Balance (Optional)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.initial_balance}
                onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                disabled={loading}
              />
            </div>
*/}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Create PIN *</Label>
                <Input
                className="text-white placeholder-white/70"
                  type="password"
                  placeholder="Enter 4-6 digit PIN"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Confirm PIN *</Label>
                <Input
                className="text-white placeholder-white/70"
                  type="password"
                  placeholder="Re-enter PIN"
                  value={formData.confirm_pin}
                  onChange={(e) => setFormData({ ...formData, confirm_pin: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Register'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-white/80">
            Already have an account?{" "}
            <Link href="/login" className="text-purple-400 hover:underline font-medium">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

}