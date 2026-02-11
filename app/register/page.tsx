'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { brand } from '@/lib/brand';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Form, 2: OTP
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    sponsorCode: '',
  });
  const [otp, setOtp] = useState('');
  const [mockOTP, setMockOTP] = useState(''); // For MVP
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setMockOTP(data.mockOTP); // Store mock OTP for display
      toast.success('OTP sent! Check console or use: ' + data.mockOTP);
      setStep(2);
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
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
        body: JSON.stringify({ email: formData.email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'OTP verification failed');
      }

      localStorage.setItem('token', data.token);
      toast.success(`Registration successful! Welcome to ${brand.appName}`);
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <BrandLogo href="/" size="lg" variant="light" className="mb-4 justify-center" />
          <p className="text-slate-300 font-medium">Create your account and join the network</p>
        </div>

        {step === 1 ? (
          <Card className="bg-slate-800 border-slate-600 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white text-xl">Join {brand.appName}</CardTitle>
              <CardDescription className="text-slate-300">
                Fill in your details to get started. You'll need a sponsor code from an existing member.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-white">
              <form onSubmit={handleRegister} className="space-y-4">
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
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-slate-300">City *</Label>
                    <Input
                      id="city"
                      placeholder="Mumbai"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
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
                  <Label htmlFor="sponsorCode" className="text-slate-300">Sponsor Code *</Label>
                  <Input
                    id="sponsorCode"
                    placeholder="Enter sponsor code (e.g., DEMO1234)"
                    value={formData.sponsorCode}
                    onChange={(e) => setFormData({ ...formData, sponsorCode: e.target.value.toUpperCase() })}
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                  <p className="text-xs text-slate-400">
                    Don't have a sponsor code? Contact an existing member to get one.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP...</>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <p className="text-slate-300">
                  Already have an account?{' '}
                  <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium underline">
                    Sign in
                  </Link>
                </p>
              </div>

              {/* Demo Sponsor Code */}
              <div className="mt-6 p-4 bg-emerald-900/20 rounded-lg border border-emerald-800">
                <p className="text-xs text-emerald-300 mb-1 font-semibold">💡 Demo Sponsor Code:</p>
                <p className="text-sm text-emerald-400 font-mono">DEMO1234</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-800 border-slate-600 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white text-xl">Verify Your Email</CardTitle>
              <CardDescription className="text-slate-300">
                Enter the 6-digit OTP sent to {formData.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-white">
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                {mockOTP && (
                  <div className="p-4 bg-emerald-900/20 rounded-lg border border-emerald-800">
                    <p className="text-xs text-emerald-300 mb-1">📧 Mock OTP (MVP Mode):</p>
                    <p className="text-2xl text-emerald-400 font-mono font-bold">{mockOTP}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      In production, this would be sent via email.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-slate-300">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
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
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                    ) : (
                      <><CheckCircle2 className="mr-2 h-4 w-4" /> Verify & Complete</>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-slate-300 hover:text-white transition font-medium">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
