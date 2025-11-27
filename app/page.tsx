import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import LoginForm from '@/components/login-form'

export default async function Home() {
  const session = await getServerSession()
  
  if (session) {
    if (session.user.role === 'ADMIN') {
      redirect('/admin')
    } else {
      redirect('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          Children Wardrobe
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Gerir o guarda-roupa dos seus filhos
        </p>
        <LoginForm />
      </div>
    </div>
  )
}

