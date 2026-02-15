'use client';

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { brand } from '@/lib/brand';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4">
      <div className="absolute top-6 left-6">
        <Link href="/">
          <BrandLogo className="h-8 w-auto" />
        </Link>
      </div>
      <div className="w-full max-w-md">
        <SignUp
          routing="path"
          path="/register"
          signInUrl="/login"
          afterSignUpUrl="/onboarding"
          redirectUrl="/onboarding"
        />
      </div>
      <p className="mt-6 text-sm text-slate-400">
        Create your {brand.appName} account
      </p>
    </div>
  );
}
