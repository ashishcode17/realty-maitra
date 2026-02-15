import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Next.js 16+: use proxy.ts only (no middleware.ts)

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/register(.*)',
  '/onboarding(.*)',
  '/api/auth/(register|verify-otp|send-login-otp|verify-login-otp|login|clerk-session|complete-signup)(.*)',
  '/api/bootstrap(.*)',
])
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/settings(.*)',
  '/network(.*)',
  '/admin(.*)',
  '/training(.*)',
  '/leads(.*)',
])

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return
  if (isProtectedRoute(req)) await auth.protect()
})

export async function proxy(request: NextRequest) {
  // Block direct access to /uploads folder
  if (request.nextUrl.pathname.startsWith('/uploads/')) {
    return NextResponse.json(
      { error: 'Direct access to files is not allowed. Use the download API.' },
      { status: 403 }
    )
  }

  return clerkHandler(request)
}

export const config = {
  matcher: [
    '/uploads/:path*',
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
