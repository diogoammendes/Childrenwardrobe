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
import { CLOTHING_CATEGORIES, getSubcategories, type ClothingCategory } from '@/lib/clothing-categories'
import PhotoUpload from '@/components/photo-upload'

type SizeOption = {
  id: string
  label: string
}

export default function EditClothingItemDialog({
  item,
  isOpen,
  onClose,
  sizeOptions = [],
}: {
  item: any
  isOpen: boolean
  onClose: () => void
  sizeOptions?: SizeOption[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    category: item.category || '',
    subcategory: item.subcategory || '',
    size: item.size || '',
    colors: '',
    photo: item.photo || '',
    status: item.status || 'IN_USE',
    disposition: item.disposition || 'KEEP',
    isSet: item.isSet || false,
    setItemId: item.setItemId || '',
    sizeOptionId: item.sizeOption?.id || '',
  })

  useEffect(() => {
    const colors = JSON.parse(item.colors || '[]')
    setFormData((prev) => ({
      ...prev,
      colors: colors.join(', '),
    }))
  }, [item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const colorsArray = formData.colors
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.length > 0)

      const response = await fetch(`/api/clothing-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          colors: colorsArray,
          sizeOptionId: formData.sizeOptionId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao atualizar peça')
      }

      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const subcategories = formData.category
    ? getSubcategories(formData.category as ClothingCategory)
    : {}

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Peça de Roupa</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => {
                setFormData({
                  ...formData,
                  category: value as ClothingCategory,
                  subcategory: '',
                })
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CLOTHING_CATEGORIES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.category && (
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategoria *</Label>
              <Select
                value={formData.subcategory}
                onValueChange={(value) =>
                  setFormData({ ...formData, subcategory: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a subcategoria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(subcategories).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="size">Tamanho *</Label>
            <Select
              value={formData.sizeOptionId}
              onValueChange={(value) => setFormData({ ...formData, sizeOptionId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tamanho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem seleção</SelectItem>
                {sizeOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!formData.sizeOptionId && (
              <Input
                id="size"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="Introduza manualmente"
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="colors">Cores (separadas por vírgula) *</Label>
            <Input
              id="colors"
              value={formData.colors}
              onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
              required
            />
          </div>

          <PhotoUpload
            value={formData.photo}
            onChange={(value) => setFormData({ ...formData, photo: value })}
            label="Foto"
          />
          
          {formData.photo && formData.photo.startsWith('data:') && (
            <div className="text-xs text-gray-500">
              Foto carregada. Pode também inserir uma URL manualmente:
            </div>
          )}
          
          {(!formData.photo || !formData.photo.startsWith('data:')) && (
            <div className="space-y-2">
              <Label htmlFor="photo-url">Ou URL da Foto</Label>
              <Input
                id="photo-url"
                type="url"
                value={formData.photo.startsWith('data:') ? '' : formData.photo}
                onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                placeholder="https://..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Estado *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) =>
                setFormData({ ...formData, status: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN_USE">Em uso</SelectItem>
                <SelectItem value="FUTURE_USE">Uso futuro</SelectItem>
                <SelectItem value="RETIRED">Retirado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="disposition">Disposição *</Label>
            <Select
              value={formData.disposition}
              onValueChange={(value: any) =>
                setFormData({ ...formData, disposition: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KEEP">Manter</SelectItem>
                <SelectItem value="SOLD">Vendido</SelectItem>
                <SelectItem value="GIVEN_AWAY">Oferecido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <div className="flex space-x-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'A guardar...' : 'Guardar'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

