import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware'

/**
 * Dev-only: run demo seeder. Only in development.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Demo seed is disabled in production' },
        { status: 403 }
      )
    }

    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    await execAsync('npx tsx scripts/seedDemo.ts', {
      cwd: process.cwd(),
      timeout: 120000,
    })

    return NextResponse.json({ success: true, message: 'Demo data seeded' })
  } catch (error: any) {
    console.error('Admin demo seed error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to run demo seed' },
      { status: 500 }
    )
  }
}
