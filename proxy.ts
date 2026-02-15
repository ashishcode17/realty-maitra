import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Next.js 16+: `middleware.ts` was renamed to `proxy.ts`
export function proxy(request: NextRequest) {
  // Block direct access to /uploads folder
  if (request.nextUrl.pathname.startsWith('/uploads/')) {
    return NextResponse.json(
      { error: 'Direct access to files is not allowed. Use the download API.' },
      { status: 403 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/uploads/:path*',
}
