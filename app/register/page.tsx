'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, Loader2, Copy } from 'lucide-react';
import Link from 'next/link';
import { brand } from '@/lib/brand';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

function getRegisterError(data: { error?: string; message?: string; code?: string }): string {
  switch (data.code) {
    case 'RATE_LIMIT':
      return 'Too many attempts. Please try again later.';
    case 'INVALID_SPONSOR_CODE':
      return 'The invite code you entered is invalid. Please verify and try again.';
    case 'invite_code_required':
      return 'A valid invite code is required to register.';
    case 'rank_not_allowed':
      return 'You cannot join at this position under your current sponsor.';
    case 'director_restricted':
      return 'Only Admin can create Director-level accounts.';
    case 'EMAIL_TAKEN':
      return 'This email is already registered. Sign in instead.';
    case 'PHONE_TAKEN':
      return 'This phone number is already registered.';
    case 'OTP_EXPIRED':
      return 'OTP expired. Request a new one.';
    case 'INVALID_OTP':
      return 'Invalid OTP. Check and try again.';
    default:
      return data.message || data.error || 'Registration failed.';
  }
}

type Step = 'enter-invite' | 'select-position' | 'account-details' | 'otp' | 'success';
type RootStep = 'root-form' | 'otp' | 'success';

export default function RegisterPage() {
  const router = useRouter();
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
  const [step, setStep] = useState<Step>('enter-invite');
  const [rootStep, setRootStep] = useState<RootStep>('root-form');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    sponsorCode: '',
    rank: '',
  });
  const [inviteContext, setInviteContext] = useState<{
    sponsorName: string;
    sponsorCode: string;
    allowedRanks: { value: string; label: string }[];
  } | null>(null);
  const [otp, setOtp] = useState('');
  const [mockOTP, setMockOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingInvite, setValidatingInvite] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successUser, setSuccessUser] = useState<{ name: string; rank: string; sponsorCode: string; sponsorName?: string } | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    fetch('/api/auth/registration-context')
      .then((r) => r.json())
      .then((d) => setIsFirstUser(d.isFirstUser === true))
      .catch(() => setIsFirstUser(false));
  }, []);

  const handleValidateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = formData.sponsorCode.trim().toUpperCase();
    if (!code) {
      toast.error('Enter an invite code.');
      return;
    }
    setValidatingInvite(true);
    try {
      const res = await fetch('/api/auth/validate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Invalid invite code.');
        return;
      }
      setInviteContext({
        sponsorName: data.sponsorName,
        sponsorCode: data.sponsorCode,
        allowedRanks: data.allowedRanks || [],
      });
      setFormData((f) => ({ ...f, sponsorCode: code, rank: '' }));
      setStep('select-position');
    } catch {
      toast.error('Failed to validate invite code.');
    } finally {
      setValidatingInvite(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        city: formData.city.trim() || undefined,
        password: formData.password,
        sponsorCode: step === 'account-details' ? formData.sponsorCode : undefined,
        rank: formData.rank || undefined,
      };
      if (rootStep === 'root-form' && isFirstUser) {
        payload.rootAdmin = true;
      }
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(getRegisterError(data));
        return;
      }
      setMockOTP(data.mockOTP ?? '');
      toast.success(data.message || 'OTP sent');
      if (data.smsFailed) toast.info('Check your email for the code.');
      if (rootStep === 'root-form') setRootStep('otp');
      else setStep('otp');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase(), otp }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(getRegisterError(data));
        return;
      }
      if (data.token) localStorage.setItem('token', data.token);
      setSuccessUser({
        name: data.user?.name || formData.name,
        rank: data.user?.rank || formData.rank || '—',
        sponsorCode: data.user?.sponsorCode || '',
        sponsorName: inviteContext?.sponsorName,
      });
      if (rootStep === 'otp') setRootStep('success');
      else setStep('success');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessContinue = () => {
    router.push('/dashboard');
  };

  if (isFirstUser === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const showRootForm = isFirstUser && !showInviteForm && rootStep === 'root-form' && step === 'enter-invite';
  const showInviteStep = (!isFirstUser || showInviteForm) && step === 'enter-invite';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6 sm:mb-8">
          <BrandLogo href="/" size="lg" variant="light" className="mb-4 justify-center" />
        </div>

        {showRootForm && (
          <Card className="bg-slate-800 border-slate-600 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white text-xl">Initialize Organization</CardTitle>
              <CardDescription className="text-slate-300">
                Create the primary administrator account. This account will control structure, ranks, and director creation.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-white">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Full Name</Label>
                    <Input required placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email Address</Label>
                    <Input required type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Phone Number</Label>
                    <Input required placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Secure Password</Label>
                  <div className="relative">
                    <Input required type={showPassword ? 'text' : 'password'} placeholder="Secure Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="bg-slate-700 border-slate-600 text-white pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Root Admin'}
                </Button>
                <p className="text-xs text-slate-500 text-center">This step can only be completed once.</p>
              </form>
              {isFirstUser && (
                <p className="mt-4 text-center text-sm text-slate-400">
                  Already have an invite code? <button type="button" onClick={() => setShowInviteForm(true)} className="text-emerald-400 hover:underline">Join with invite code</button>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {showInviteStep && (
          <Card className="bg-slate-800 border-slate-600 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white text-xl">Join the Organization</CardTitle>
              <CardDescription className="text-slate-300">Enter a valid invite code to continue.</CardDescription>
            </CardHeader>
            <CardContent className="text-white">
              <form onSubmit={handleValidateInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Invite Code</Label>
                  <Input placeholder="e.g. A9K2" value={formData.sponsorCode} onChange={(e) => setFormData({ ...formData, sponsorCode: e.target.value.trim().toUpperCase() })} className="bg-slate-700 border-slate-600 text-white font-mono" />
                </div>
                <Button type="submit" disabled={validatingInvite} className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white">
                  {validatingInvite ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Continue
                </Button>
              </form>
              {isFirstUser && (
                <p className="mt-4 text-center text-sm text-slate-400">
                  First time? <button type="button" onClick={() => setShowInviteForm(false)} className="text-emerald-400 hover:underline">Create root admin</button>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {step === 'select-position' && inviteContext && (
          <Card className="bg-slate-800 border-slate-600 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white text-xl">Select Your Position</CardTitle>
              <CardDescription className="text-slate-300">Your available positions are based on your sponsor&apos;s rank.</CardDescription>
            </CardHeader>
            <CardContent className="text-white space-y-4">
              <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                <p className="text-sm text-slate-400">You are joining under:</p>
                <p className="font-semibold text-white">{inviteContext.sponsorName}</p>
                <p className="text-sm text-slate-300">Sponsor Code: <span className="font-mono">{inviteContext.sponsorCode}</span></p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); setStep('account-details'); }}>
                <div className="space-y-2">
                  <Label className="text-slate-300">Position</Label>
                  <select
                    required
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                    className="w-full h-10 rounded-md bg-slate-700 border border-slate-600 text-white px-3"
                  >
                    <option value="">Select position</option>
                    {inviteContext.allowedRanks.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full min-h-[44px] mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">Continue</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'account-details' && (
          <Card className="bg-slate-800 border-slate-600 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white text-xl">Complete Your Registration</CardTitle>
            </CardHeader>
            <CardContent className="text-white">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Full Name</Label>
                    <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email Address</Label>
                    <Input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Phone Number</Label>
                    <Input required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">City</Label>
                    <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Password</Label>
                  <div className="relative">
                    <Input required type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="bg-slate-700 border-slate-600 text-white pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP...</> : 'Create My Account'}
                </Button>
                <Button type="button" variant="ghost" className="w-full text-slate-400" onClick={() => setStep('select-position')}>Back</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {(step === 'otp' || rootStep === 'otp') && (
          <Card className="bg-slate-800 border-slate-600 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white text-xl">Verify OTP</CardTitle>
              <CardDescription className="text-slate-300">Enter the 6-digit OTP sent to your email</CardDescription>
            </CardHeader>
            <CardContent className="text-white">
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                {mockOTP && (
                  <div className="p-4 bg-emerald-900/20 rounded-lg border border-emerald-800">
                    <p className="text-xs text-emerald-300 mb-1">Dev OTP:</p>
                    <p className="text-2xl text-emerald-400 font-mono font-bold">{mockOTP}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-slate-300">Enter OTP</Label>
                  <Input type="text" inputMode="numeric" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} required className="bg-slate-700 border-slate-600 text-white text-2xl text-center tracking-widest" />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => rootStep === 'otp' ? setRootStep('root-form') : setStep('account-details')} className="flex-1 min-h-[44px] border-slate-500 bg-slate-700/60 text-slate-100">Back</Button>
                  <Button type="submit" disabled={loading || otp.length !== 6} className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Verify</>}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {(step === 'success' || rootStep === 'success') && successUser && (
          <Card className="bg-slate-800 border-slate-600 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white text-xl">Welcome to the Organization</CardTitle>
              <CardDescription className="text-slate-300">
                You have successfully joined under {successUser.sponsorName ? `${successUser.sponsorName}` : 'Root Admin'}.<br />
                Your Position: <strong>{successUser.rank}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-white space-y-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">Your Personal Invite Code</p>
                <div className="flex items-center gap-2">
                  <code className="px-4 py-2 bg-slate-900 rounded font-mono text-emerald-400 text-lg">{successUser.sponsorCode || '—'}</code>
                  <Button size="sm" onClick={() => { if (successUser.sponsorCode) { navigator.clipboard.writeText(successUser.sponsorCode); toast.success('Copied!'); } }} className="bg-emerald-600 hover:bg-emerald-700">
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Share this code to build your team.</p>
              </div>
              <Button onClick={handleSuccessContinue} className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white">Go to Dashboard</Button>
            </CardContent>
          </Card>
        )}

        {showInviteStep && (
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">Already have an account? <Link href="/login" className="text-emerald-400 hover:underline">Sign in</Link></p>
          </div>
        )}
        {step !== 'success' && rootStep !== 'success' && (
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-slate-400 hover:text-white">← Back to home</Link>
          </div>
        )}
      </div>
    </div>
  );
}
