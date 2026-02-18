import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrDirector } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import path from 'node:path'
import fs from 'fs/promises'
import { isDbStoredGovtId, getGovtIdFromDb } from '@/lib/govtIdDb'
import {
  isFirebaseGovtIdPath,
  downloadGovtIdFromFirebase,
} from '@/lib/govtIdStorage'

const UPLOADS_PATH = path.join(process.cwd(), 'uploads')

/**
 * GET /api/files/govt-id/[userId]
 * Admin/Director only. Serve the user's Govt ID image (from Firebase or local uploads).
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await requireAdminOrDirector(request)
    if (auth instanceof NextResponse) return auth

    const { userId } = await context.params
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { idImageUrl: true },
    })
    if (!user?.idImageUrl) {
      return NextResponse.json({ error: 'No Govt ID on file' }, { status: 404 })
    }

    let buffer: Buffer
    let mime: string
    if (isDbStoredGovtId(user.idImageUrl)) {
      const row = await getGovtIdFromDb(userId)
      if (!row) {
        return NextResponse.json({ error: 'No Govt ID on file' }, { status: 404 })
      }
      buffer = row.buffer
      mime = row.mime
    } else if (isFirebaseGovtIdPath(user.idImageUrl)) {
      buffer = await downloadGovtIdFromFirebase(user.idImageUrl)
      const ext = path.extname(user.idImageUrl).toLowerCase()
      mime = ext === '.png' ? 'image/png' : 'image/jpeg'
    } else {
      const fullPath = path.join(process.cwd(), user.idImageUrl)
      if (!fullPath.startsWith(UPLOADS_PATH)) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 403 })
      }
      buffer = await fs.readFile(fullPath)
      const ext = path.extname(user.idImageUrl).toLowerCase()
      mime = ext === '.png' ? 'image/png' : 'image/jpeg'
    }

    const ext = mime === 'image/png' ? '.png' : '.jpg'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `inline; filename="govt-id-${userId}${ext}"`,
      },
    })
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    console.error('Govt ID serve error:', e)
    return NextResponse.json({ error: 'Failed to load Govt ID' }, { status: 500 })
  }
}
