import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import { hasRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import AdminNav from '@/components/admin-nav'

export const dynamic = 'force-dynamic'

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
      <AdminNav user={session.user} appName={appName} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

