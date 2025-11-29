import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Users, Share2 } from 'lucide-react'
import { getAccessibleChildren } from '@/lib/child-access'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/')
  }

  let children = []
  try {
    children = session.user.roles?.includes('ADMIN')
      ? await prisma.child.findMany({
          include: {
            parent: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        })
      : await getAccessibleChildren(session.user.id)
  } catch (error) {
    console.error('Error fetching children:', error)
    // Continue with empty array if query fails
  }

  return (
    <div className="min-h-screen pb-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            As Minhas Crianças
          </h1>
          <p className="text-gray-600">Gerir o guarda-roupa de cada criança</p>
        </div>
        <Link href="/dashboard/children/new">
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Criança
          </Button>
        </Link>
      </div>

      {children.length === 0 ? (
        <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6">
            <Users className="h-12 w-12 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            Ainda não tem crianças registadas
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Comece por adicionar a primeira criança e comece a organizar o guarda-roupa
          </p>
          <Link href="/dashboard/children/new">
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeira Criança
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child: any) => {
            const age = Math.floor(
              (new Date().getTime() - new Date(child.birthDate).getTime()) /
                (1000 * 60 * 60 * 24 * 365.25)
            )
            const isOwner = child.parentId === session.user.id
            const isShared = !isOwner && !session.user.roles?.includes('ADMIN')
            return (
              <Link
                key={child.id}
                href={`/dashboard/children/${child.id}`}
                className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1"
              >
                <div className="relative h-32 bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400">
                  {child.photo ? (
                    <img
                      src={child.photo}
                      alt={child.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">{child.name.charAt(0).toUpperCase()}</span>
                      </div>
                    </div>
                  )}
                  {isShared && (
                    <div className="absolute top-3 right-3 flex items-center text-xs text-white bg-blue-600/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-lg">
                      <Share2 className="h-3 w-3 mr-1" />
                      Partilhada
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-indigo-600 transition-colors">
                    {child.name}
                  </h2>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-semibold text-gray-700 w-20">Idade:</span>
                      <span>{age} anos</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-semibold text-gray-700 w-20">Género:</span>
                      <span>{child.gender}</span>
                    </div>
                    {child.height && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-semibold text-gray-700 w-20">Altura:</span>
                        <span>{child.height} cm</span>
                      </div>
                    )}
                    {child.weight && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-semibold text-gray-700 w-20">Peso:</span>
                        <span>{child.weight} kg</span>
                      </div>
                    )}
                    {child.shoeSize && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-semibold text-gray-700 w-20">Sapato:</span>
                        <span>{child.shoeSize}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs text-indigo-600 font-semibold group-hover:text-indigo-700">
                      Ver guarda-roupa →
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

