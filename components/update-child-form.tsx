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
import { Edit, X } from 'lucide-react'
import PhotoUpload from '@/components/photo-upload'

type SizeOption = {
  id: string
  label: string
}

export default function UpdateChildForm({ child, sizeOptions = [] }: { child: any; sizeOptions?: SizeOption[] }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    height: child.height?.toString() || '',
    weight: child.weight?.toString() || '',
    shoeSize: child.shoeSize || '',
    photo: child.photo || '',
    currentSizeId: child.currentSizeId || '',
    secondarySizeId: child.secondarySizeId || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/children/${child.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          height: formData.height ? parseFloat(formData.height) : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          shoeSize: formData.shoeSize || null,
          photo: formData.photo || null,
          currentSizeId: formData.currentSizeId || null,
          secondarySizeId: formData.secondarySizeId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao atualizar')
      }

      router.refresh()
      setIsOpen(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        <Edit className="mr-2 h-4 w-4" />
        Editar Dados
      </Button>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Editar Dados</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="height">Altura (cm)</Label>
          <Input
            id="height"
            type="number"
            step="0.1"
            value={formData.height}
            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
            placeholder="Ex: 85.5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Peso (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            placeholder="Ex: 12.5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shoeSize">Tamanho de Sapato</Label>
          <Input
            id="shoeSize"
            value={formData.shoeSize}
            onChange={(e) => setFormData({ ...formData, shoeSize: e.target.value })}
            placeholder="Ex: 28"
          />
        </div>

        <PhotoUpload
          value={formData.photo}
          onChange={(value) => setFormData({ ...formData, photo: value })}
          label="Foto da Criança"
        />

        <div className="space-y-2">
          <Label>Tamanho atual</Label>
        <Select
          value={formData.currentSizeId || '__none__'}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              currentSizeId: value === '__none__' ? '' : value,
            })
          }
        >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tamanho atual" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="__none__">Sem seleção</SelectItem>
              {sizeOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tamanho adicional (acima/abaixo)</Label>
        <Select
          value={formData.secondarySizeId || '__none__'}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              secondarySizeId: value === '__none__' ? '' : value,
            })
          }
        >
            <SelectTrigger>
              <SelectValue placeholder="Opcional" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="__none__">Sem seleção</SelectItem>
              {sizeOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <div className="flex space-x-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'A guardar...' : 'Guardar'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}

