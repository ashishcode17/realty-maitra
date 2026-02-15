'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

type LoginMode = 'password' | 'otp';

function getLoginErrorMessage(data: { error?: string; code?: string; message?: string }): string {
  const code = data.code;
  if (code === 'RATE_LIMIT') return 'Too many attempts. Please try again later.';
  if (code === 'DATABASE_CONNECTION_ERROR' || code === 'DATABASE_QUERY_ERROR') {
    return 'Something went wrong. Please try again in a moment.';
  }
  return data.message || data.error || 'Login failed.';
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>('password');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [mockOtp, setMockOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(text ? text.slice(0, 150) : 'Server error');
      }
      const data = await response.json();
      if (!response.ok) throw new Error(getLoginErrorMessage(data));
      if (!data.token) throw new Error('No token received');
      localStorage.setItem('token', data.token);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = formData.email.trim().toLowerCase();
    if (!email) {
      toast.error('Enter your email');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          data.code === 'RATE_LIMIT'
            ? 'Too many OTP requests. Please try again later.'
            : data.code === 'USER_NOT_FOUND'
              ? 'No account found with this email.'
              : data.error || data.message || 'Failed to send OTP';
        toast.error(msg);
        return;
      }
      setOtpSent(true);
      setOtp('');
      if (data.mockOTP) setMockOtp(data.mockOTP);
      toast.success(data.message || 'OTP sent');
      if (data.smsFailed) toast.info('Check your email for the code.');
    } catch {
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = formData.email.trim().toLowerCase();
    if (!email || otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (!response.ok) {
        const msg =
          data.code === 'RATE_LIMIT'
            ? 'Too many attempts. Please try again later.'
            : data.code === 'OTP_EXPIRED'
              ? 'OTP expired. Request a new one.'
              : data.error || data.message || 'Invalid OTP';
        toast.error(msg);
        return;
      }
      if (!data.token) throw new Error('No token received');
      localStorage.setItem('token', data.token);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/">
            <BrandLogo className="h-9 w-auto mx-auto" />
          </Link>
          <p className="mt-4 text-slate-300 font-medium">Sign in to your account</p>
        </div>
        <Card className="bg-slate-800 border-slate-600 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === 'password' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => { setMode('password'); setOtpSent(false); }}
                className={mode === 'password' ? 'bg-emerald-600 hover:bg-emerald-700' : 'text-slate-400'}
              >
                <KeyRound className="h-4 w-4 mr-1" /> Password
              </Button>
              <Button
                type="button"
                variant={mode === 'otp' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => { setMode('otp'); setOtpSent(false); }}
                className={mode === 'otp' ? 'bg-emerald-600 hover:bg-emerald-700' : 'text-slate-400'}
              >
                <Mail className="h-4 w-4 mr-1" /> OTP
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-white">
            {mode === 'password' ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required className="bg-slate-700 border-slate-600 text-white pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white">
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            ) : (
              <>
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-otp" className="text-slate-300">Email</Label>
                      <Input id="email-otp" type="email" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="bg-slate-700 border-slate-600 text-white" />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white">Send OTP</Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    {mockOtp && (
                      <div className="p-3 bg-emerald-900/20 rounded border border-emerald-800 text-sm text-emerald-300 font-mono" aria-hidden="true">Code: {mockOtp}</div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-slate-300">Enter 6-digit OTP</Label>
                      <Input id="otp" type="text" inputMode="numeric" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} required className="bg-slate-700 border-slate-600 text-white text-center text-xl tracking-widest" />
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row gap-3">
                      <Button type="button" variant="outline" onClick={() => setOtpSent(false)} className="flex-1 min-h-[44px] border-2 border-slate-500 bg-slate-700/60 text-slate-100 hover:bg-slate-600 hover:border-slate-400 hover:text-white">Back</Button>
                      <Button type="submit" disabled={loading || otp.length !== 6} className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white">Verify</Button>
                    </div>
                  </form>
                )}
              </>
            )}
            <p className="mt-4 text-center text-sm text-slate-400">
              Don&apos;t have an account? <Link href="/register" className="text-emerald-400 hover:underline">Sign up</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
