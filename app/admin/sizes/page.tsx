import { getServerSession } from '@/lib/auth'
import { hasRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SizeOptionsManager from '@/components/size-options-manager'

export const dynamic = 'force-dynamic'

export default async function AdminSizesPage() {
  const session = await getServerSession()

  if (!session || !hasRole(session, 'ADMIN')) {
    redirect('/')
  }

  let sizes = []
  try {
    sizes = await prisma.sizeOption.findMany({
      orderBy: { order: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching sizes:', error)
    // Continue with empty array if query fails
  }

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

