'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { X } from 'lucide-react'

interface SharedUser {
  id: string
  name: string | null
  email: string
}

interface Share {
  id: string
  user: SharedUser
}

interface ShareChildDialogProps {
  childId: string
  isOpen: boolean
  onClose: () => void
}

export default function ShareChildDialog({
  childId,
  isOpen,
  onClose,
}: ShareChildDialogProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sharedWith, setSharedWith] = useState<Share[]>([])
  const [loadingShares, setLoadingShares] = useState(false)

  useEffect(() => {
    if (isOpen && childId) {
      loadShares()
    }
  }, [isOpen, childId])

  const loadShares = async () => {
    setLoadingShares(true)
    try {
      const response = await fetch(`/api/children/${childId}/share`)
      if (response.ok) {
        const data = await response.json()
        setSharedWith(data)
      }
    } catch (err) {
      console.error('Erro ao carregar partilhas:', err)
    } finally {
      setLoadingShares(false)
    }
  }

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/children/${childId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao partilhar')
      }

      setEmail('')
      loadShares()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveShare = async (userId: string) => {
    if (!confirm('Tem a certeza que deseja remover esta partilha?')) {
      return
    }

    try {
      const response = await fetch(`/api/children/${childId}/share/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao remover partilha')
      }

      loadShares()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Partilhar Criança</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={handleShare} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do utilizador</Label>
              <div className="flex space-x-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="utilizador@example.com"
                  required
                />
                <Button type="submit" disabled={loading}>
                  {loading ? 'A partilhar...' : 'Partilhar'}
                </Button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}
          </form>

          <div className="space-y-2">
            <Label>Partilhado com:</Label>
            {loadingShares ? (
              <div className="text-sm text-gray-500">A carregar...</div>
            ) : sharedWith.length === 0 ? (
              <div className="text-sm text-gray-500">
                Nenhum utilizador partilhado
              </div>
            ) : (
              <div className="space-y-2">
                {sharedWith.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <div className="font-medium">
                        {share.user.name || 'Sem nome'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {share.user.email}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveShare(share.user.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

