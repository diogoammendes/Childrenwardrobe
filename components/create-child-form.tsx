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
import PhotoUpload from '@/components/photo-upload'

type SizeOption = {
  id: string
  label: string
}

export default function CreateChildForm({ sizeOptions }: { sizeOptions: SizeOption[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    birthDate: '',
    photo: '',
    currentSizeId: '',
    secondarySizeId: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          photo: formData.photo || null,
          currentSizeId: formData.currentSizeId || null,
          secondarySizeId: formData.secondarySizeId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao criar criança')
      }

      const child = await response.json()
      router.push(`/dashboard/children/${child.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Nome da criança"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">Género *</Label>
        <Select
          value={formData.gender}
          onValueChange={(value) => setFormData({ ...formData, gender: value })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o género" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Masculino">Masculino</SelectItem>
            <SelectItem value="Feminino">Feminino</SelectItem>
            <SelectItem value="Outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthDate">Data de Nascimento *</Label>
        <Input
          id="birthDate"
          type="date"
          value={formData.birthDate}
          onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
          required
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
            <SelectValue placeholder="Opcional: selecione um segundo tamanho" />
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
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      <div className="flex space-x-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'A criar...' : 'Criar Criança'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}

