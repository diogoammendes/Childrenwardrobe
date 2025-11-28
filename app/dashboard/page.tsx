import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Users, Share2 } from 'lucide-react'
import { getAccessibleChildren } from '@/lib/child-access'

export default async function DashboardPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/')
  }

  const children = session.user.role === 'ADMIN'
    ? await prisma.child.findMany({
        include: {
          parent: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    : await getAccessibleChildren(session.user.id)

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">As Minhas Crianças</h1>
        <Link href="/dashboard/children/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Criança
          </Button>
        </Link>
      </div>

      {children.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Ainda não tem crianças registadas
          </h3>
          <p className="text-gray-500 mb-4">
            Comece por adicionar a primeira criança
          </p>
          <Link href="/dashboard/children/new">
            <Button>Adicionar Primeira Criança</Button>
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
            const isShared = !isOwner && session.user.role === 'PARENT'
            return (
              <Link
                key={child.id}
                href={`/dashboard/children/${child.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-center mb-4">
                  {child.photo && (
                    <img
                      src={child.photo}
                      alt={child.name}
                      className="w-16 h-16 rounded-full object-cover mr-4"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h2 className="text-xl font-semibold text-gray-800">
                        {child.name}
                      </h2>
                      {isShared && (
                        <span className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          <Share2 className="h-3 w-3 mr-1" />
                          Partilhada
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Idade:</span> {age} anos
                  </p>
                  <p>
                    <span className="font-medium">Género:</span> {child.gender}
                  </p>
                  {child.height && (
                    <p>
                      <span className="font-medium">Altura:</span> {child.height} cm
                    </p>
                  )}
                  {child.weight && (
                    <p>
                      <span className="font-medium">Peso:</span> {child.weight} kg
                    </p>
                  )}
                  {child.shoeSize && (
                    <p>
                      <span className="font-medium">Tamanho de sapato:</span> {child.shoeSize}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

