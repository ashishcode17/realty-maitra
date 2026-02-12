import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs/promises'

const UPLOADS_PATH = path.join(process.cwd(), 'uploads')

/**
 * GET /api/files/avatar/[userId]
 * Serve the user's profile photo. Requester must be the user or admin.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { userId } = await context.params
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const isOwn = auth.userId === userId
    const isAdmin = auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN'
    if (!isOwn && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhotoUrl: true },
    })
    if (!user?.profilePhotoUrl) {
      return NextResponse.json({ error: 'No avatar' }, { status: 404 })
    }

    const fullPath = path.join(process.cwd(), user.profilePhotoUrl)
    if (!fullPath.startsWith(UPLOADS_PATH)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 })
    }

    const buffer = await fs.readFile(fullPath)
    const ext = path.extname(user.profilePhotoUrl).toLowerCase()
    const mime =
      ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    console.error('Avatar serve error:', e)
    return NextResponse.json({ error: 'Failed to load avatar' }, { status: 500 })
  }
}
