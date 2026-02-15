'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier, type ConfirmationResult } from 'firebase/auth';
import { brand } from '@/lib/brand';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { getFirebaseApp } from '@/lib/firebase-client';

const hideDemo = process.env.NEXT_PUBLIC_HIDE_DEMO === 'true';

function toE164(phone: string): string {
  const raw = phone.replace(/\D/g, '')
  if (raw.length === 10 && (raw.startsWith('6') || raw.startsWith('7') || raw.startsWith('8') || raw.startsWith('9'))) return `+91${raw}`
  if (raw.length === 12 && raw.startsWith('91')) return `+${raw}`
  return raw.startsWith('+') ? phone.trim() : `+${raw}`
}

function getRegisterError(data: { error?: string; message?: string; code?: string }): string {
  switch (data.code) {
    case 'RATE_LIMIT':
      return 'Too many attempts. Please try again later.';
    case 'INVALID_SPONSOR_CODE':
      return 'Invalid sponsor code. Get a valid code from your inviter.';
    case 'EMAIL_TAKEN':
      return 'This email is already registered. Sign in instead.';
    case 'MISSING_FIREBASE_TOKEN':
    case 'INVALID_FIREBASE_TOKEN':
      return data.message || 'Phone verification failed. Try again.';
    default:
      return data.message || data.error || 'Registration failed.';
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    sponsorCode: '',
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const app = getFirebaseApp();
    if (!app) {
      toast.error('Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* env vars.');
      return;
    }
    const phoneStr = formData.phone.trim();
    if (!phoneStr) {
      toast.error('Enter your phone number');
      return;
    }
    const e164 = toE164(phoneStr);
    setLoading(true);
    try {
      const auth = getAuth(app);
      if (!recaptchaContainerRef.current) {
        toast.error('Recaptcha container not found');
        return;
      }
      const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        size: 'invisible',
        callback: () => {},
      });
      const confirmation = await signInWithPhoneNumber(auth, e164, recaptchaVerifier);
      confirmationResultRef.current = confirmation;
      toast.success('OTP sent to your phone');
      setStep(2);
      setOtp('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const confirmation = confirmationResultRef.current;
    if (!confirmation) {
      toast.error('Session expired. Go back and send OTP again.');
      return;
    }
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const result = await confirmation.confirm(otp);
      const idToken = await result.user.getIdToken();
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, firebaseIdToken: idToken }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(getRegisterError(data));
        return;
      }
      if (data.token) localStorage.setItem('token', data.token);
      toast.success(`Welcome to ${brand.appName}!`);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <BrandLogo href="/" size="lg" variant="light" className="mb-4 justify-center" />
          <p className="text-slate-300 font-medium">Create your account and join the network</p>
        </div>

        {step === 1 ? (
          <Card className="bg-slate-800 border-slate-600 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white text-xl">Join {brand.appName}</CardTitle>
              <CardDescription className="text-slate-300">
                Fill in your details. We&apos;ll send an OTP to your phone to verify (via Firebase).
              </CardDescription>
            </CardHeader>
            <CardContent className="text-white">
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div id="recaptcha-container" ref={recaptchaContainerRef} />
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">Email *</Label>
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
                    <Label htmlFor="phone" className="text-slate-300">Phone *</Label>
                    <Input
                      id="phone"
                      placeholder="9876543210 or +91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-slate-300">City</Label>
                    <Input
                      id="city"
                      placeholder="Mumbai"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
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
                <div className="space-y-2">
                  <Label htmlFor="sponsorCode" className="text-slate-300">Sponsor / Invite Code *</Label>
                  <Input
                    id="sponsorCode"
                    placeholder="Enter invite code from your sponsor"
                    value={formData.sponsorCode}
                    onChange={(e) => setFormData({ ...formData, sponsorCode: e.target.value.trim().toUpperCase() })}
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP...</> : 'Send OTP to phone'}
                </Button>
              </form>
              <div className="mt-6 text-center text-sm">
                <p className="text-slate-300">
                  Already have an account?{' '}
                  <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium underline">Sign in</Link>
                </p>
              </div>
              {!hideDemo && (
                <div className="mt-6 p-4 bg-emerald-900/20 rounded-lg border border-emerald-800">
                  <p className="text-xs text-emerald-300 mb-1 font-semibold">Demo invite code:</p>
                  <p className="text-sm text-emerald-400 font-mono">DEMO1234</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-800 border-slate-600 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white text-xl">Verify your phone</CardTitle>
              <CardDescription className="text-slate-300">
                Enter the 6-digit OTP sent to {formData.phone}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-white">
              <form onSubmit={handleVerifyAndRegister} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-slate-300">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 text-2xl text-center tracking-widest"
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 border-slate-700 text-white hover:bg-slate-800"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Verify & Complete</>}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-slate-300 hover:text-white transition font-medium">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
