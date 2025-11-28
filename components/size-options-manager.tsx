'use client'

import { useState } from 'react'
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
import { Trash2, Save, Plus } from 'lucide-react'

interface SizeOption {
  id: string
  label: string
  description: string | null
  order: number
  isActive: boolean
}

export default function SizeOptionsManager({
  initialSizes,
}: {
  initialSizes: SizeOption[]
}) {
  const router = useRouter()
  const [sizes, setSizes] = useState<SizeOption[]>(initialSizes)
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    order: '',
  })
  const [loadingId, setLoadingId] = useState<string | 'new' | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.label.trim()) return

    try {
      setLoadingId('new')
      const response = await fetch('/api/size-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: formData.label.trim(),
          description: formData.description.trim() || null,
          order: formData.order ? Number(formData.order) : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao criar tamanho')
      }

      const created = await response.json()
      setSizes((prev) =>
        [...prev, created].sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
      )
      setFormData({ label: '', description: '', order: '' })
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Erro ao criar tamanho')
    } finally {
      setLoadingId(null)
    }
  }

  const handleSave = async (sizeId: string, payload: Partial<SizeOption>) => {
    try {
      setLoadingId(sizeId)
      const response = await fetch(`/api/size-options/${sizeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao atualizar tamanho')
      }

      const updated = await response.json()
      setSizes((prev) =>
        prev
          .map((size) => (size.id === sizeId ? updated : size))
          .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
      )
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Erro ao guardar alterações')
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (sizeId: string) => {
    if (!confirm('Tem a certeza que deseja eliminar este tamanho?')) return

    try {
      setLoadingId(sizeId)
      const response = await fetch(`/api/size-options/${sizeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao eliminar tamanho')
      }

      setSizes((prev) => prev.filter((size) => size.id !== sizeId))
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Erro ao eliminar tamanho')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleCreate}
        className="bg-white p-4 rounded-lg shadow space-y-4 border"
      >
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar novo tamanho
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              value={formData.label}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, label: e.target.value }))
              }
              placeholder="Ex: 6-9 meses"
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Descrição</Label>
            <Input
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Notas adicionais"
            />
          </div>
          <div className="space-y-2">
            <Label>Ordem</Label>
            <Input
              type="number"
              min={0}
              value={formData.order}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, order: e.target.value }))
              }
              placeholder="Maior valor = mais velho"
            />
          </div>
        </div>
        <div className="text-right">
          <Button type="submit" disabled={loadingId === 'new'}>
            {loadingId === 'new' ? 'A guardar...' : 'Adicionar'}
          </Button>
        </div>
      </form>

      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Lista de tamanhos ({sizes.length})
          </h2>
        </div>
        <div className="divide-y">
          {sizes.map((size) => (
            <div
              key={size.id}
              className="p-4 grid grid-cols-1 md:grid-cols-6 gap-4 items-center"
            >
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs uppercase text-gray-500">Nome</Label>
                <Input
                  value={size.label}
                  onChange={(e) =>
                    setSizes((prev) =>
                      prev.map((item) =>
                        item.id === size.id
                          ? { ...item, label: e.target.value }
                          : item
                      )
                    )
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs uppercase text-gray-500">
                  Descrição
                </Label>
                <Input
                  value={size.description || ''}
                  onChange={(e) =>
                    setSizes((prev) =>
                      prev.map((item) =>
                        item.id === size.id
                          ? { ...item, description: e.target.value }
                          : item
                      )
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-gray-500">Ordem</Label>
                <Input
                  type="number"
                  value={size.order}
                  onChange={(e) =>
                    setSizes((prev) =>
                      prev.map((item) =>
                        item.id === size.id
                          ? { ...item, order: Number(e.target.value) }
                          : item
                      )
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-gray-500">Estado</Label>
                <Select
                  value={size.isActive ? 'active' : 'inactive'}
                  onValueChange={(value) =>
                    setSizes((prev) =>
                      prev.map((item) =>
                        item.id === size.id
                          ? { ...item, isActive: value === 'active' }
                          : item
                      )
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() =>
                    handleSave(size.id, {
                      label: size.label.trim(),
                      description: size.description?.trim() || null,
                      order: size.order,
                      isActive: size.isActive,
                    })
                  }
                  disabled={loadingId === size.id}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Guardar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() => handleDelete(size.id)}
                  disabled={loadingId === size.id}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remover
                </Button>
              </div>
            </div>
          ))}
          {sizes.length === 0 && (
            <p className="p-6 text-sm text-gray-500">Ainda não existem tamanhos configurados.</p>
          )}
        </div>
      </div>
    </div>
  )
}

