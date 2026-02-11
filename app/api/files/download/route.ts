import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const searchParams = request.nextUrl.searchParams
    const fileId = searchParams.get('id')

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Backward-compatible redirect to the new route:
    // /api/files/download/:fileId
    return NextResponse.redirect(new URL(`/api/files/download/${fileId}`, request.url))
  } catch (error: any) {
    console.error('File download error:', error)
    return NextResponse.json(
      { error: 'Failed to download file', message: error.message },
      { status: 500 }
    )
  }
}
