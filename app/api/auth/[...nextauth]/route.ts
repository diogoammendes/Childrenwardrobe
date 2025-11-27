import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Validate environment variables before initializing NextAuth
if (!process.env.NEXTAUTH_SECRET) {
  console.error('❌ CRITICAL: NEXTAUTH_SECRET is not set!')
  console.error('   Authentication will fail. Please set NEXTAUTH_SECRET in Railway variables.')
}

if (!process.env.NEXTAUTH_URL) {
  console.error('❌ CRITICAL: NEXTAUTH_URL is not set!')
  console.error('   Please set NEXTAUTH_URL to your Railway app URL.')
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

