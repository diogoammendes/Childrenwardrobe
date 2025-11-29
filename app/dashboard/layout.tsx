import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import { hasRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import DashboardNav from '@/components/dashboard-nav'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/')
  }

  // Se tem role ADMIN mas não tem PARENT, redirecionar para admin
  if (hasRole(session, 'ADMIN') && !hasRole(session, 'PARENT')) {
    redirect('/admin')
  }

  let appName = 'Children Wardrobe'
  try {
    const appConfig = await prisma.appConfig.findUnique({
      where: { key: 'app_name' },
    })
    appName = appConfig?.value || 'Children Wardrobe'
  } catch (error) {
    console.error('Error fetching app config:', error)
    // Use default name if database query fails
  }

  return (
    <div className="min-h-screen">
      <DashboardNav user={session.user} appName={appName} />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {children}
      </main>
    </div>
  )
}

