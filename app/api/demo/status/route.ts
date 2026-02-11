import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public: used only to show/hide DEMO banner.
export async function GET() {
  try {
    const demoExists =
      (await prisma.user.count({ where: { isDemo: true } })) > 0 ||
      (await prisma.project.count({ where: { isDemo: true } })) > 0

    return NextResponse.json({ demoExists })
  } catch {
    return NextResponse.json({ demoExists: false })
  }
}

