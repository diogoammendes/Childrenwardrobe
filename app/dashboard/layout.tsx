import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
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

  if (session.user.role === 'ADMIN') {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen">
      <DashboardNav user={session.user} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

