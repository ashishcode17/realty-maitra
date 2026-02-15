import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { verifyToken } from './auth'
import { prisma } from './prisma'

/** Try Clerk first, then Bearer JWT. Use in API route handlers. */
export async function getAuthUser(request: NextRequest) {
  const { userId: clerkUserId } = await auth()
  if (clerkUserId) {
    const u = await prisma.user.findFirst({
      where: { clerkUserId },
    })
    if (u && (u.status === 'ACTIVE' || u.status === 'FROZEN')) {
      return {
        ...u,
        userId: u.id,
        _id: u.id,
      }
    }
  }
  return await authenticateUser(request)
}

export async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const decoded = verifyToken(token)
  
  if (!decoded) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  })
  
  // Allow ACTIVE and FROZEN to authenticate; FROZEN restrictions enforced per-route
  if (!user || (user.status !== 'ACTIVE' && user.status !== 'FROZEN')) {
    return null
  }

  // Invalidate token if user did "logout all" (tokenVersion bumped)
  const tokenVersion = (user as { tokenVersion?: number }).tokenVersion ?? 0
  if ((decoded.tokenVersion ?? 0) !== tokenVersion) {
    return null
  }

  return {
    ...user,
    userId: user.id,
    _id: user.id, // For compatibility
  }
}

export async function requireAuth(request: NextRequest) {
  const user = await getAuthUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return user
}

export async function requireAdmin(request: NextRequest) {
  const user = await getAuthUser(request)
  
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  
  return user
}
