import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

/**
 * GET /api/search?q=...
 * Global search: users (admin only), projects, training content.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 20)

    if (q.length < 2) {
      return NextResponse.json({
        users: [],
        projects: [],
        training: [],
      })
    }

    const isAdmin = auth.role === 'ADMIN' || auth.role === 'SUPER_ADMIN'

    const [users, projects, training] = await Promise.all([
      isAdmin
        ? prisma.user.findMany({
            where: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            },
            select: { id: true, name: true, email: true },
            orderBy: { name: 'asc' },
            take: limit,
          })
        : [],
      prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { location: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, location: true },
        orderBy: { name: 'asc' },
        take: limit,
      }),
      prisma.trainingContent.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, category: true },
        orderBy: { title: 'asc' },
        take: limit,
      }),
    ])

    return NextResponse.json({
      users: users.map((u) => ({ id: u.id, name: u.name, email: u.email, href: `/admin/users/${u.id}` })),
      projects: projects.map((p) => ({ id: p.id, name: p.name, location: p.location, href: `/projects/${p.id}` })),
      training: training.map((t) => ({ id: t.id, title: t.title, category: t.category, href: '/training' })),
    })
  } catch (error: unknown) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
