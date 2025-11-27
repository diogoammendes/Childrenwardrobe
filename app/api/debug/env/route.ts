import { NextResponse } from 'next/server'

export async function GET() {
  // Only allow in development or with proper authentication
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  return NextResponse.json({
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
  })
}

