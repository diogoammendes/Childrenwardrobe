import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CreateUserForm from '@/components/create-user-form'

export const dynamic = 'force-dynamic'

export default async function NewUserPage() {
  const session = await getServerSession()
  
  if (!session || !session.user.roles?.includes('ADMIN')) {
    redirect('/')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Criar Novo Utilizador</h1>
      <CreateUserForm />
    </div>
  )
}

