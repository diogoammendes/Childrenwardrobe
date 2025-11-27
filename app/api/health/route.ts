import { NextResponse } from 'next/server'

export async function GET() {
  // Simple health check endpoint that doesn't require database or auth
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  })
}

