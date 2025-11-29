import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Users, UserPlus, Settings, Edit } from 'lucide-react'
import { hasRole } from '@/lib/auth-helpers'
import UsersTable from '@/components/users-table'
import AppConfigSection from '@/components/app-config-section'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getServerSession()
  
  if (!session || !hasRole(session, 'ADMIN')) {
    redirect('/')
  }

  const users = await prisma.user.findMany({
    include: {
      userRoles: true,
      _count: {
        select: { children: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const appConfig = await prisma.appConfig.findMany()
  const configMap: Record<string, string> = {}
  appConfig.forEach(config => {
    configMap[config.key] = config.value
  })

  const totalChildren = await prisma.child.count()
  const totalItems = await prisma.clothingItem.count()

  return (
    <div className="min-h-screen pb-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Painel de Administração
        </h1>
        <p className="text-gray-600">Gerir utilizadores e configurações do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total de Utilizadores</h3>
          <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{users.length}</p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total de Crianças</h3>
          <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{totalChildren}</p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total de Peças</h3>
          <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{totalItems}</p>
        </div>
      </div>

      <AppConfigSection initialConfig={configMap} />

      <UsersTable users={users.map(u => ({
        ...u,
        roles: u.userRoles.map((ur: { role: string }) => ur.role),
      }))} />
    </div>
  )
}

