'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CLOTHING_CATEGORIES, getSubcategories, type ClothingCategory } from '@/lib/clothing-categories'
import { Plus, X } from 'lucide-react'

export default function CategoryMinimums({ childId, minimums }: { childId: string; minimums: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    category: '' as ClothingCategory | '',
    subcategory: '',
    minimum: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/category-minimums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          minimum: parseInt(formData.minimum),
          childId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao adicionar mínimo')
      }

      router.refresh()
      setIsAdding(false)
      setFormData({
        category: '' as ClothingCategory | '',
        subcategory: '',
        minimum: '',
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (minimumId: string) => {
    try {
      const response = await fetch(`/api/category-minimums/${minimumId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao eliminar')
      }

      router.refresh()
    } catch (error) {
      alert('Erro ao eliminar mínimo')
    }
  }

  const subcategories = formData.category
    ? getSubcategories(formData.category)
    : {}

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Mínimos por Categoria</h3>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Mínimo
          </Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded-lg bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    category: e.target.value as ClothingCategory,
                    subcategory: '',
                  })
                }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Selecione...</option>
                {Object.entries(CLOTHING_CATEGORIES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.category && (
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategoria</Label>
                <select
                  id="subcategory"
                  value={formData.subcategory}
                  onChange={(e) =>
                    setFormData({ ...formData, subcategory: e.target.value })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Selecione...</option>
                  {Object.entries(subcategories).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label as string}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="minimum">Mínimo</Label>
              <Input
                id="minimum"
                type="number"
                min="1"
                value={formData.minimum}
                onChange={(e) => setFormData({ ...formData, minimum: e.target.value })}
                required
              />
            </div>

            <div className="flex items-end space-x-2">
              <Button type="submit" disabled={loading} size="sm">
                {loading ? 'A guardar...' : 'Guardar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAdding(false)
                  setFormData({
                    category: '' as ClothingCategory | '',
                    subcategory: '',
                    minimum: '',
                  })
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </form>
      )}

      {minimums.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum mínimo definido</p>
      ) : (
        <div className="space-y-2">
          {minimums.map((minimum) => {
            const categoryLabel = CLOTHING_CATEGORIES[minimum.category as ClothingCategory]?.label || minimum.category
            const subcategories = getSubcategories(minimum.category as ClothingCategory)
            const subcategoryLabel = (subcategories as Record<string, string>)[minimum.subcategory] || minimum.subcategory

            return (
              <div
                key={minimum.id}
                className="flex justify-between items-center p-3 border rounded-lg"
              >
                <div>
                  <span className="font-medium">{categoryLabel}</span>
                  {' - '}
                  <span>{subcategoryLabel}</span>
                  {' - '}
                  <span className="text-blue-600 font-semibold">Mínimo: {minimum.minimum}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(minimum.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

