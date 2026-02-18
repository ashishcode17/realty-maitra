'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react'
import { InviteCodeField } from '@/components/InviteCodeField';
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
    case 'GOVT_ID_REQUIRED':
      return 'Govt ID image is required to register.';
    case 'GOVT_ID_TOO_LARGE':
      return 'Govt ID file is too large. Maximum size is 2MB.';
    case 'GOVT_ID_INVALID_TYPE':
      return 'Invalid file type. Only JPG and PNG are allowed for Govt ID.';
    case 'GOVT_ID_SAVE_FAILED':
      return data.message || 'Failed to save Govt ID. Please try again.';
    case 'REGISTRATION_FAILED':
      return data.message || 'Registration failed. Please try again.';
    case 'VERIFICATION_FAILED':
      return data.message || 'Verification failed. Please try again.';
    case 'INVALID_STATE':
      return data.message || 'Session expired. Please start registration again.';
    default:
      return data.message || data.error || 'Registration failed.';
  }
}

type Step = 'enter-invite' | 'account-details' | 'otp' | 'success';
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
    sponsorRankLabel: string;
    isDirectorSeed?: boolean;
  } | null>(null);
  const [otp, setOtp] = useState('');
  const [mockOTP, setMockOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingInvite, setValidatingInvite] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successUser, setSuccessUser] = useState<{ name: string; rank: string; sponsorCode: string; sponsorName?: string; govtIdUploaded?: boolean } | null>(null);
  const [govtIdFile, setGovtIdFile] = useState<File | null>(null);
  // Persistent error so you can read and copy the actual message (toast disappears too fast)
  const [lastError, setLastError] = useState<{ message: string; code?: string; detail?: string; raw?: string } | null>(null);

  useEffect(() => {
    fetch('/api/bootstrap-status')
      .then((r) => r.json())
      .then((d) => setIsFirstUser(d.hasUsers === false))
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
        toast.error('Invalid invite code.');
        return;
      }
      setInviteContext({
        sponsorName: data.sponsorName,
        sponsorCode: data.sponsorCode,
        sponsorRankLabel: data.sponsorRankLabel ?? data.sponsorRank ?? '',
        isDirectorSeed: data.isDirectorSeed === true,
      });
      setFormData((f) => ({ ...f, sponsorCode: code }));
      setStep('account-details');
    } catch {
      toast.error('Failed to validate invite code.');
    } finally {
      setValidatingInvite(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const isRoot = rootStep === 'root-form' && isFirstUser;
    if (!isRoot && !govtIdFile) {
      toast.error('Govt ID image is required.');
      return;
    }
    if (!isRoot && govtIdFile && govtIdFile.size > 2 * 1024 * 1024) {
      toast.error('Govt ID file must be 2MB or smaller.');
      return;
    }
    if (!isRoot && govtIdFile) {
      const t = (govtIdFile.type ?? '').toLowerCase();
      if (t !== 'image/jpeg' && t !== 'image/png') {
        toast.error('Govt ID must be JPG or PNG.');
        return;
      }
    }
    setLastError(null);
    setLoading(true);
    try {
      let body: string | FormData;
      let headers: Record<string, string> = {};
      if (isRoot) {
        body = JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          city: formData.city.trim() || undefined,
          password: formData.password,
          rootAdmin: true,
        });
        headers['Content-Type'] = 'application/json';
      } else {
        const fd = new FormData();
        fd.append('name', formData.name.trim());
        fd.append('email', formData.email.trim().toLowerCase());
        fd.append('phone', formData.phone.trim());
        fd.append('city', formData.city.trim());
        fd.append('password', formData.password);
        fd.append('sponsorCode', formData.sponsorCode);
        if (govtIdFile) fd.append('govtId', govtIdFile);
        body = fd;
      }
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers,
        body,
      });
      let data: { message?: string; error?: string; code?: string; mockOTP?: string; smsFailed?: boolean } = {};
      try {
        data = await response.json();
      } catch {
        setLastError({ message: 'Server returned invalid JSON. Check Network tab (F12 → Network) for the response.', raw: `Status: ${response.status}` });
        toast.error('Server error. See red error box below.');
        return;
      }
      if (!response.ok) {
        const displayMsg = getRegisterError(data);
        setLastError({
          message: data.message || data.error || displayMsg,
          code: data.code,
          detail: (data as { detail?: string }).detail,
          raw: JSON.stringify(data, null, 2),
        });
        toast.error(displayMsg);
        return;
      }
      setLastError(null);
      setMockOTP((data as { mockOTP?: string }).mockOTP ?? '');
      toast.success(data.message || 'OTP sent');
      if (data.smsFailed) toast.info('Check your email for the code.');
      if (rootStep === 'root-form') setRootStep('otp');
      else setStep('otp');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLastError({ message: msg, raw: err instanceof Error ? err.stack : String(err) });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLastError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase(), otp }),
      });
      let data: { message?: string; error?: string; code?: string; token?: string; user?: { name?: string; rank?: string; sponsorCode?: string } } = {};
      try {
        data = await response.json();
      } catch {
        setLastError({ message: 'Server returned invalid JSON. Check Network tab (F12 → Network).', raw: `Status: ${response.status}` });
        toast.error('Server error. See red error box below.');
        return;
      }
      if (!response.ok) {
        const displayMsg = getRegisterError(data);
        setLastError({
          message: data.message || data.error || displayMsg,
          code: data.code,
          detail: (data as { detail?: string }).detail,
          raw: JSON.stringify(data, null, 2),
        });
        toast.error(displayMsg);
        return;
      }
      setLastError(null);
      if (data.token) localStorage.setItem('token', data.token);
      setSuccessUser({
        name: data.user?.name || formData.name,
        rank: data.user?.rank || formData.rank || '—',
        sponsorCode: data.user?.sponsorCode || '',
        sponsorName: inviteContext?.sponsorName,
        govtIdUploaded: !!inviteContext,
      });
      if (rootStep === 'otp') setRootStep('success');
      else setStep('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLastError({ message: msg, raw: err instanceof Error ? err.stack : String(err) });
      toast.error(msg);
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

  const showRootForm = isFirstUser && rootStep === 'root-form' && step === 'enter-invite';
  const showInviteStep = !isFirstUser && step === 'enter-invite';

  const copyError = () => {
    if (!lastError) return;
    const text = lastError.raw ?? `${lastError.code ?? ''}: ${lastError.message}`;
    void navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6 sm:mb-8">
          <BrandLogo href="/" size="lg" variant="light" className="mb-4 justify-center" />
        </div>

        {lastError && (
          <Card className="mb-6 border-red-500/80 bg-red-950/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-400 text-sm font-medium">Error (see below to copy)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-red-200 text-sm break-words">{lastError.message}</p>
              {lastError.detail && (
                <p className="text-amber-200 text-sm break-words font-mono">Actual error: {lastError.detail}</p>
              )}
              {lastError.code && <p className="text-red-400/80 text-xs">Code: {lastError.code}</p>}
              {lastError.raw && (
                <pre className="text-xs bg-black/30 p-3 rounded overflow-auto max-h-32 text-slate-300 break-all whitespace-pre-wrap">{lastError.raw}</pre>
              )}
              <Button type="button" variant="outline" size="sm" onClick={copyError} className="border-red-500/50 text-red-300 hover:bg-red-900/30">
                Copy full error
              </Button>
            </CardContent>
          </Card>
        )}

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
            </CardContent>
          </Card>
        )}

        {step === 'account-details' && (
          <Card className="bg-slate-800 border-slate-600 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white text-xl">Complete Your Registration</CardTitle>
            </CardHeader>
            <CardContent className="text-white space-y-4">
              {inviteContext && (
                <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600 space-y-1">
                  {inviteContext.isDirectorSeed ? (
                    <>
                      <p className="text-sm font-medium text-slate-400">Organization Invitation (Issued by Director/Admin)</p>
                      <p className="text-sm text-slate-300">Issuer: {inviteContext.sponsorName}</p>
                      <p className="text-sm text-slate-300">Invite Code: <span className="font-mono">{inviteContext.sponsorCode}</span></p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-slate-400">Sponsor</p>
                      <p className="font-semibold text-white">{inviteContext.sponsorName}</p>
                      <p className="text-sm text-slate-300">Position: {inviteContext.sponsorRankLabel}</p>
                      <p className="text-sm text-slate-300">Invite Code: <span className="font-mono">{inviteContext.sponsorCode}</span></p>
                    </>
                  )}
                </div>
              )}
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
                {!isFirstUser && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">Govt ID (JPG/PNG, max 2MB) *</Label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      required={!isFirstUser}
                      className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-slate-700 file:text-white"
                      onChange={(e) => setGovtIdFile(e.target.files?.[0] ?? null)}
                    />
                    <p className="text-xs text-slate-500">Required. Max 2MB. JPG or PNG only.</p>
                  </div>
                )}
                <Button type="submit" disabled={loading} className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP...</> : 'Create My Account'}
                </Button>
                <Button type="button" variant="ghost" className="w-full text-slate-400" onClick={() => setStep('enter-invite')}>Back</Button>
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
                {successUser.govtIdUploaded && <><br />Govt ID: Uploaded ✅</>}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-white space-y-6">
              <div>
                <InviteCodeField
                  code={successUser.sponsorCode || null}
                  label="Your Personal Invite Code"
                  helperText="Share this code to build your team."
                  size="lg"
                />
              </div>
              <Button onClick={handleSuccessContinue} className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white">Go to Dashboard</Button>
            </CardContent>
          </Card>
        )}

        {(showRootForm || showInviteStep) && (
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
