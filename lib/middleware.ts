import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'
import { prisma } from './prisma'

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
  const user = await authenticateUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return user
}

export async function requireAdmin(request: NextRequest) {
  const user = await authenticateUser(request)
  
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  
  return user
}

/** Admin or Director only. Use for ledger, online users, exports, govt ID download. */
export async function requireAdminOrDirector(request: NextRequest) {
  const user = await authenticateUser(request)
  const allowed = user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'DIRECTOR')
  if (!allowed) {
    return NextResponse.json({ error: 'Admin or Director access required' }, { status: 403 })
  }
  return user
}
