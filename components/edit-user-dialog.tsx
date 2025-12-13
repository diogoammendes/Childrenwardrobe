'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { X, Save, Trash2 } from 'lucide-react'

type User = {
  id: string
  email: string
  name?: string | null
  roles: string[]
}

export default function EditUserDialog({
  user,
  isOpen,
  onClose,
}: {
  user: User | null
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roles: [] as string[],
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email,
        password: '',
        roles: user.roles || [],
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload: any = {
        name: formData.name || null,
        email: formData.email,
        roles: formData.roles,
      }

      if (formData.password.trim() !== '') {
        payload.password = formData.password
      }

      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao atualizar utilizador')
      }

      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem a certeza que deseja eliminar este utilizador? Esta ação não pode ser desfeita.')) {
      return
    }

    setError('')
    setDeleting(true)

    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao eliminar utilizador')
      }

      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const toggleRole = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }))
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Editar Utilizador</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do utilizador"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Nova Palavra-passe</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Deixe em branco para manter a atual"
            />
            <p className="text-xs text-gray-500">
              Deixe em branco se não quiser alterar a palavra-passe
            </p>
          </div>

          <div className="space-y-2">
            <Label>Roles *</Label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.roles.includes('ADMIN')}
                  onChange={() => toggleRole('ADMIN')}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-sm font-medium">Administrador</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.roles.includes('PARENT')}
                  onChange={() => toggleRole('PARENT')}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-sm font-medium">Pai/Mãe</span>
              </label>
            </div>
            {formData.roles.length === 0 && (
              <p className="text-xs text-red-500">
                Selecione pelo menos uma role
              </p>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || loading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? 'A eliminar...' : 'Eliminar Utilizador'}
            </Button>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || formData.roles.length === 0}
                className="bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'A guardar...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}




