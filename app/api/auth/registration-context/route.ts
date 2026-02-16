import { NextResponse } from 'next/server'
import { isFirstUserAllowed } from '@/lib/join'

/**
 * GET: Public. Returns whether root admin registration is allowed (no users exist yet).
 */
export async function GET() {
  try {
    const isFirstUser = await isFirstUserAllowed()
    return NextResponse.json({ isFirstUser })
  } catch (e) {
    console.error('Registration context error:', e)
    return NextResponse.json({ isFirstUser: false }, { status: 500 })
  }
}
