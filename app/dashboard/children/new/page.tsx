import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CreateChildForm from '@/components/create-child-form'

export default async function NewChildPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Adicionar Nova Criança</h1>
      <CreateChildForm />
    </div>
  )
}

