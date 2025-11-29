import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import { hasRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import AdminNav from '@/components/admin-nav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/')
  }

  if (!hasRole(session, 'ADMIN')) {
    redirect('/dashboard')
  }

  const appConfig = await prisma.appConfig.findUnique({
    where: { key: 'app_name' },
  })
  const appName = appConfig?.value || 'Children Wardrobe'

  return (
    <div className="min-h-screen">
      <AdminNav user={session.user} appName={appName} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

