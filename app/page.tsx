import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import LoginForm from '@/components/login-form'

export const dynamic = 'force-dynamic'

export default async function Home() {
  try {
    const session = await getServerSession()
    
    if (session?.user) {
    if (session.user.roles?.includes('ADMIN')) {
      redirect('/admin')
    } else {
      redirect('/dashboard')
    }
    }
  } catch (error: any) {
    // NEXT_REDIRECT is not an error, it's how Next.js handles redirects
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error // Re-throw redirect errors
    }
    console.error('Error checking session:', error)
    // Continue to show login form if there's an error
  }

  const appConfig = await prisma.appConfig.findUnique({
    where: { key: 'app_name' },
  })
  const appName = appConfig?.value || 'Children Wardrobe'

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="w-full max-w-md p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {appName}
          </h1>
          <p className="text-gray-600 text-lg">
            Gerir o guarda-roupa dos seus filhos
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

