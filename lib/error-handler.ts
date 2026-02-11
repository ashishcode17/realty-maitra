import { NextResponse } from 'next/server'

export function handleApiError(error: any, context: string = 'API') {
  console.error(`${context} error:`, error)
  
  // Prisma errors
  if (error.code === 'P1001') {
    return NextResponse.json(
      { 
        error: 'Database connection failed',
        message: 'Cannot reach database server. Please check your DATABASE_URL in .env file. Get a free database from https://neon.tech',
        code: 'DATABASE_CONNECTION_ERROR'
      },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  if (error.code?.startsWith('P')) {
    return NextResponse.json(
      { 
        error: 'Database error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'A database error occurred',
        code: error.code
      },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  // Generic error
  return NextResponse.json(
    { 
      error: 'An error occurred',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later',
    },
    { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}
