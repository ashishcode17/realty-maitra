'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server error: Database connection failed. Please check your database setup.');
      }

      const data = await response.json();

      if (!response.ok) {
        const code = data.code as string | undefined;
        if (code === 'DATABASE_CONNECTION_ERROR' || code === 'DATABASE_QUERY_ERROR') {
          const hint = 'Can\'t reach database. If you use Neon.tech: open https://console.neon.tech → select your project → Resume the database, then try again. See CHECK_NEON_DATABASE.txt in the project for full steps.';
          throw new Error(`${data.error || 'Database error'}: ${hint}`);
        }
        const msg = data.message ? `${data.error || 'Error'}: ${data.message}` : (data.error || data.message || 'Login failed');
        throw new Error(msg);
      }

      if (!data.token) {
        throw new Error('No token received from server');
      }

      localStorage.setItem('token', data.token);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Login failed. Please check your database connection.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <BrandLogo href="/" size="lg" variant="light" className="mb-4 justify-center" />
          <p className="text-slate-300 font-medium">Sign in to your account</p>
        </div>

        {/* Login Card - dark box, all text explicit for visibility */}
        <Card className="bg-slate-800 border-slate-600 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-xl">Welcome Back</CardTitle>
            <CardDescription className="text-slate-300">
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="text-white">
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-slate-300">
                Don't have an account?{' '}
                <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium underline">
                  Register here
                </Link>
              </p>
            </div>

            {/* Login credentials */}
            <div className="mt-6 p-4 bg-slate-700/80 rounded-lg border border-slate-600">
              <p className="text-xs text-slate-200 mb-2 font-semibold">Try these (after seeding):</p>
              <p className="text-xs text-slate-200 mb-1">Main admin: admin@realtycollective.com / admin123</p>
              <p className="text-xs text-slate-200 mb-1">Demo admin: demo-admin@realtycollective.com / admin123</p>
              <p className="text-xs text-slate-200 mb-1">SSM user: ssm1@demo.realtycollective.com / demo123</p>
              <p className="text-xs text-slate-200 mb-1">BDM user: bdm1-1@demo.realtycollective.com / demo123</p>
              <p className="text-xs text-slate-400 mt-2">Demo users exist only after you run: npm run seed:demo</p>
            </div>
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
