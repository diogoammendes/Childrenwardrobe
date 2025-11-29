import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CreateChildForm from '@/components/create-child-form'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function NewChildPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/')
  }

  let sizeOptions: Array<{
    id: string
    label: string
    description: string | null
    order: number
    isActive: boolean
  }> = []
  try {
    sizeOptions = await prisma.sizeOption.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching size options:', error)
    // Continue with empty array if query fails
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Adicionar Nova Criança</h1>
      <CreateChildForm sizeOptions={sizeOptions} />
    </div>
  )
}

