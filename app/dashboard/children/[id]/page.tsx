import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Share2 } from 'lucide-react'
import ChildWardrobe from '@/components/child-wardrobe'
import UpdateChildForm from '@/components/update-child-form'
import CategoryMinimums from '@/components/category-minimums'
import ShareChildButton from '@/components/share-child-button'
import { hasChildAccess } from '@/lib/child-access'

export default async function ChildPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/')
  }

  const child = await prisma.child.findUnique({
    where: { id: params.id },
    include: {
      clothingItems: {
        orderBy: { createdAt: 'desc' },
      },
      categoryMinimums: {
        orderBy: [{ category: 'asc' }, { subcategory: 'asc' }],
      },
    },
  })

  if (!child) {
    redirect('/dashboard')
  }

  // Verificar se o utilizador tem acesso a esta criança
  if (session.user.role === 'PARENT') {
    const hasAccess = await hasChildAccess(session.user.id, params.id)
    if (!hasAccess) {
      redirect('/dashboard')
    }
  }
  
  const isOwner = child.parentId === session.user.id

  const age = Math.floor(
    (new Date().getTime() - new Date(child.birthDate).getTime()) /
      (1000 * 60 * 60 * 24 * 365.25)
  )

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar
        </Link>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{child.name}</h1>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Idade:</span> {age} anos</p>
              <p><span className="font-medium">Género:</span> {child.gender}</p>
              <p><span className="font-medium">Data de nascimento:</span> {new Date(child.birthDate).toLocaleDateString('pt-PT')}</p>
              {child.height && <p><span className="font-medium">Altura:</span> {child.height} cm</p>}
              {child.weight && <p><span className="font-medium">Peso:</span> {child.weight} kg</p>}
              {child.shoeSize && <p><span className="font-medium">Tamanho de sapato:</span> {child.shoeSize}</p>}
            </div>
          </div>
          <div className="flex space-x-2">
            {isOwner && <ShareChildButton childId={child.id} />}
            <UpdateChildForm child={child} />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <CategoryMinimums childId={child.id} minimums={child.categoryMinimums} />
      </div>

      <ChildWardrobe childId={child.id} items={child.clothingItems} />
    </div>
  )
}

