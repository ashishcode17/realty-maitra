'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier, type ConfirmationResult } from 'firebase/auth';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { getFirebaseApp } from '@/lib/firebase-client';

const hideDemo = process.env.NEXT_PUBLIC_HIDE_DEMO === 'true';

type LoginMode = 'password' | 'otp';

function getLoginErrorMessage(data: { error?: string; code?: string; message?: string }): string {
  const code = data.code;
  if (code === 'RATE_LIMIT') return 'Too many attempts. Please try again later.';
  if (code === 'DATABASE_CONNECTION_ERROR' || code === 'DATABASE_QUERY_ERROR') {
    return "Can't reach database. If you use Neon: resume the database in console.neon.tech, then try again.";
  }
  return data.message || data.error || 'Login failed.';
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>('password');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

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
      const res = await fetch('/api/auth/get-login-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          data.code === 'RATE_LIMIT'
            ? 'Too many attempts. Please try again later.'
            : data.code === 'USER_NOT_FOUND'
              ? 'No account found with this email.'
              : data.code === 'NO_PHONE'
                ? 'No phone on file for this account.'
                : data.error || data.message || 'Failed to get phone';
        toast.error(msg);
        return;
      }
      const phone = data.phone as string;
      const app = getFirebaseApp();
      if (!app || !recaptchaContainerRef.current) {
        toast.error('Firebase is not configured or recaptcha missing.');
        return;
      }
      const auth = getAuth(app);
      const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, { size: 'invisible', callback: () => {} });
      const confirmation = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
      confirmationResultRef.current = confirmation;
      setOtpSent(true);
      setOtp('');
      toast.success('OTP sent to your phone');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send OTP');
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
    const confirmation = confirmationResultRef.current;
    if (!confirmation) {
      toast.error('Session expired. Go back and send OTP again.');
      return;
    }
    setLoading(true);
    try {
      const result = await confirmation.confirm(otp);
      const idToken = await result.user.getIdToken();
      const response = await fetch('/api/auth/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firebaseIdToken: idToken }),
      });
      const data = await response.json();
      if (!response.ok) {
        const msg =
          data.code === 'RATE_LIMIT'
            ? 'Too many attempts. Please try again later.'
            : data.code === 'INVALID_FIREBASE_TOKEN'
              ? 'Invalid or expired verification. Try again.'
              : data.code === 'PHONE_MISMATCH'
                ? 'Phone does not match this account.'
                : data.error || data.message || 'Verification failed';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo href="/" size="lg" variant="light" className="mb-4 justify-center" />
          <p className="text-slate-300 font-medium">Sign in to your account</p>
        </div>

        <Card className="bg-slate-800 border-slate-600 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-xl">Welcome Back</CardTitle>
            <CardDescription className="text-slate-300">
              {mode === 'password' ? 'Enter your credentials' : 'Sign in with a one-time code'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-white">
            {/* Toggle Password / OTP */}
            <div className="flex rounded-lg bg-slate-700/50 p-1 mb-4">
              <button
                type="button"
                onClick={() => { setMode('password'); setOtpSent(false); setOtp(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${mode === 'password' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <KeyRound className="h-4 w-4" /> Password
              </button>
              <button
                type="button"
                onClick={() => { setMode('otp'); setOtpSent(false); setOtp(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${mode === 'otp' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Mail className="h-4 w-4" /> OTP
              </button>
            </div>

            {mode === 'password' ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200 font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-200 font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            ) : (
              <>
                <div id="login-recaptcha" ref={recaptchaContainerRef} className="hidden" />
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp-email" className="text-slate-200 font-medium">Email</Label>
                      <Input
                        id="otp-email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      {loading ? 'Sending...' : 'Send OTP to phone'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-slate-200 font-medium">Enter 6-digit OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="bg-slate-700 border-slate-600 text-white text-center text-xl tracking-widest"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-slate-600 text-slate-300"
                        onClick={() => { setOtpSent(false); setOtp(''); }}
                      >
                        Back
                      </Button>
                      <Button type="submit" disabled={loading || otp.length !== 6} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                        {loading ? 'Verifying...' : 'Verify'}
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}

            <div className="mt-6 text-center text-sm">
              <p className="text-slate-300">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium underline">
                  Join with invite code
                </Link>
              </p>
            </div>

            {!hideDemo && mode === 'password' && (
              <div className="mt-6 p-4 bg-slate-700/80 rounded-lg border border-slate-600">
                <p className="text-xs text-slate-200 mb-2 font-semibold">Try these (after seeding):</p>
                <p className="text-xs text-slate-200 mb-1">admin@realtycollective.com / admin123</p>
                <p className="text-xs text-slate-400 mt-2">Run: npm run seed:demo for more</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-slate-300 hover:text-white transition font-medium">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
