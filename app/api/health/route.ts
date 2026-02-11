import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test database connection
    const { prisma } = await import('@/lib/prisma')
    await prisma.$connect()
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
