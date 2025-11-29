'use client';
import Image from "next/image";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Building2, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { setAuth } from '@/lib/auth';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mobile: '',
    pin: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/vendor/login', formData);
      const { token, vendor } = response.data;

      setAuth(token, vendor);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error) {
      toast.error(
        error.response?.data?.detail || 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/images/bg.png')" }}
    >
      {/* ✅ Dark Overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* ✅ Glass Login Card */}
      <div className="relative z-10 w-full max-w-md p-4">
        <Card
          className="
            w-full
            bg-white/10 backdrop-blur-xl
            border border-white/20
            rounded-2xl
            shadow-2xl
            shadow-[0_0_40px_rgba(168,85,247,0.35)]
            hover:scale-[1.02]
            transition-transform duration-300
          "
        >
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
{/** 
            <CardTitle className="text-3xl font-bold text-white text-center">
   ನಮ್ಮPay  
</CardTitle>*/}

            <CardDescription className="text-white/80">
              Sign in to access your vendor dashboard
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mobile */}
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-white">
                  Mobile Number
                </Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value })
                  }
                  required
                  disabled={loading}
                  className="bg-white/20 text-white placeholder:text-white/60"
                />
              </div>

              {/* PIN */}
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-white">
                  PIN
                </Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter your PIN"
                  value={formData.pin}
                  onChange={(e) =>
                    setFormData({ ...formData, pin: e.target.value })
                  }
                  required
                  disabled={loading}
                  className="bg-white/20 text-white placeholder:text-white/60"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:opacity-90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Register Link */}
            <div className="mt-4 text-center text-sm">
              <span className="text-white/70">
                Don't have an account?
              </span>{' '}
              <Link
                href="/register"
                className="text-violet-300 hover:underline font-medium"
              >
                Register here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
