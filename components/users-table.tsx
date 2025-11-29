'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserPlus, Edit } from 'lucide-react'
import EditUserDialog from './edit-user-dialog'

type User = {
  id: string
  email: string
  name?: string | null
  roles: string[]
  _count: {
    children: number
  }
  createdAt: Date
}

export default function UsersTable({ users }: { users: User[] }) {
  const [editingUser, setEditingUser] = useState<User | null>(null)

  return (
    <>
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Utilizadores</h2>
          <Link href="/admin/users/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg">
              <UserPlus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Novo Utilizador</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Crianças
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-900 max-w-[120px] sm:max-w-none truncate">
                      {user.name || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 max-w-[150px] sm:max-w-none truncate">
                      {user.email}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${
                              role === 'ADMIN'
                                ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200'
                                : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {role === 'ADMIN' ? 'Admin' : 'Pai/Mãe'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-700">
                      {user._count.children}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingUser(user)}
                        className="text-xs"
                      >
                        <Edit className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </>
  )
}

