import { getServerSession } from '@/lib/auth'
import { hasRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SizeOptionsManager from '@/components/size-options-manager'

export default async function AdminSizesPage() {
  const session = await getServerSession()

  if (!session || !hasRole(session, 'ADMIN')) {
    redirect('/')
  }

  const sizes = await prisma.sizeOption.findMany({
    orderBy: { order: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestão de Tamanhos</h1>
        <p className="text-gray-600">
          Defina e organize a lista de tamanhos disponíveis para utilização nas peças e crianças.
        </p>
      </div>
      <SizeOptionsManager initialSizes={sizes} />
    </div>
  )
}

