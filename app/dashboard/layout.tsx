import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import { hasRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import DashboardNav from '@/components/dashboard-nav'

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

  const appConfig = await prisma.appConfig.findUnique({
    where: { key: 'app_name' },
  })
  const appName = appConfig?.value || 'Children Wardrobe'

  return (
    <div className="min-h-screen">
      <DashboardNav user={session.user} appName={appName} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

