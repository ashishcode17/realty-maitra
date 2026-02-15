'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { brand } from '@/lib/brand';

export default function OnboardingPage() {
  const router = useRouter();
  const [sponsorCode, setSponsorCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorCode.trim() || !name.trim()) {
      toast.error('Enter your name and sponsor code');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsorCode: sponsorCode.trim().toUpperCase(), name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || data.message || 'Something went wrong');
        return;
      }
      toast.success('Welcome! Redirecting...');
      router.push('/dashboard');
      router.refresh();
    } catch {
      toast.error('Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4">
      <div className="absolute top-6 left-6">
        <Link href="/">
          <BrandLogo className="h-8 w-auto" />
        </Link>
      </div>
      <Card className="w-full max-w-md bg-slate-800 border-slate-600 shadow-xl">
        <CardHeader>
          <CardTitle className="text-white text-xl">Almost there</CardTitle>
          <CardDescription className="text-slate-300">
            Enter your name and sponsor code to join {brand.appName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Your name *</Label>
              <Input
                id="name"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sponsorCode" className="text-slate-300">Sponsor / Invite code *</Label>
              <Input
                id="sponsorCode"
                placeholder="e.g. DEMO1234"
                value={sponsorCode}
                onChange={(e) => setSponsorCode(e.target.value.trim().toUpperCase())}
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {loading ? 'Joining...' : 'Join'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-400">
            Demo code: <span className="font-mono text-emerald-400">DEMO1234</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
