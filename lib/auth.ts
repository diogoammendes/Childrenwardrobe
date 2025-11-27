import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  console.error('❌ NEXTAUTH_SECRET is not set. Authentication will not work properly.')
  console.error('   Please set NEXTAUTH_SECRET in your environment variables.')
  console.error('   Generate one with: openssl rand -base64 32')
}

if (!process.env.NEXTAUTH_URL) {
  console.warn('⚠️  NEXTAUTH_URL is not set. This may cause issues in production.')
  console.warn('   Please set NEXTAUTH_URL to your application URL (e.g., https://your-app.up.railway.app)')
}

if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL) {
  console.log('✅ NextAuth environment variables are configured')
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('Error in authorize:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
  },
}

export async function getServerSession() {
  try {
    const { getServerSession: getSession } = await import('next-auth/next')
    const { headers } = await import('next/headers')
    
    const headersList = await headers()
    const req = {
      headers: Object.fromEntries(headersList.entries()),
    } as any

    return await getSession({ req, ...authOptions })
  } catch (error) {
    console.error('Error getting server session:', error)
    return null
  }
}

