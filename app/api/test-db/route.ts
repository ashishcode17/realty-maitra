import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Database connection failed',
      hint: 'Check DATABASE_URL in .env file',
    }, { status: 500 })
  }
}
