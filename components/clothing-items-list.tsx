'use client'

import { useState, useMemo } from 'react'
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
import { getCategoryLabel, getSubcategoryLabel, CLOTHING_CATEGORIES, getSubcategories, type ClothingCategory } from '@/lib/clothing-categories'
import { Edit, Trash2, ArrowRight, ChevronDown, ChevronUp, Filter, X } from 'lucide-react'
import EditClothingItemDialog from './edit-clothing-item-dialog'
import TransferItemDialog from './transfer-item-dialog'

type SizeOption = {
  id: string
  label: string
}

export default function ClothingItemsList({
  childId,
  items,
  sizeOptions = [],
}: {
  childId: string
  items: any[]
  sizeOptions?: SizeOption[]
}) {
  const router = useRouter()
  const [editingItem, setEditingItem] = useState<any>(null)
  const [transferringItem, setTransferringItem] = useState<any>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState({
    category: '',
    subcategory: '',
    sizeOptionId: '',
    sizeText: '',
    colors: '',
    status: '',
    disposition: '',
  })

  const handleDelete = async (itemId: string) => {
    if (!confirm('Tem a certeza que deseja eliminar esta peça?')) {
      return
    }

    try {
      const response = await fetch(`/api/clothing-items/${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao eliminar')
      }

      router.refresh()
    } catch (error) {
      alert('Erro ao eliminar peça')
    }
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  // Filtrar items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      try {
        if (filters.category && item.category !== filters.category) return false
        if (filters.subcategory && item.subcategory !== filters.subcategory) return false
        if (filters.sizeOptionId && item.sizeOptionId !== filters.sizeOptionId) return false
        if (filters.sizeText && !item.size?.toLowerCase().includes(filters.sizeText.toLowerCase())) return false
        if (filters.colors) {
          let colors: string[] = []
          try {
            colors = JSON.parse(item.colors || '[]')
          } catch {
            // Se falhar o parse, assume array vazio
            colors = []
          }
          const searchColors = filters.colors.toLowerCase()
          if (!colors.some((c: string) => c?.toLowerCase().includes(searchColors))) return false
        }
        if (filters.status && filters.status !== '__all__' && item.status !== filters.status) return false
        if (filters.disposition && filters.disposition !== '__all__' && item.disposition !== filters.disposition) return false
        return true
      } catch (error) {
        console.error('Erro ao filtrar item:', error, item)
        return false
      }
    })
  }, [items, filters])

  const groupedItems = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const category = item.category as ClothingCategory
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(item)
      return acc
    }, {} as Record<string, any[]>)
  }, [filteredItems])

  const hasActiveFilters = Object.values(filters).some((v) => v !== '')

  const clearFilters = () => {
    setFilters({
      category: '',
      subcategory: '',
      sizeOptionId: '',
      sizeText: '',
      colors: '',
      status: '',
      disposition: '',
    })
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500 mb-4">Ainda não há peças de roupa adicionadas</p>
        <p className="text-sm text-gray-400">Comece por adicionar a primeira peça</p>
      </div>
    )
  }

  const statusLabels = {
    IN_USE: 'Em uso',
    FUTURE_USE: 'Uso futuro',
    RETIRED: 'Retirado',
  }

  const dispositionLabels = {
    KEEP: 'Manter',
    SOLD: 'Vendido',
    GIVEN_AWAY: 'Oferecido',
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {Object.values(filters).filter(v => v !== '').length}
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="filter-category">Categoria</Label>
              <Select
                value={filters.category || undefined}
                onValueChange={(value) => {
                  setFilters({ ...filters, category: value, subcategory: '' })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {Object.entries(CLOTHING_CATEGORIES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-subcategory">Subcategoria</Label>
              <Select
                value={filters.subcategory || undefined}
                onValueChange={(value) => setFilters({ ...filters, subcategory: value })}
                disabled={!filters.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as subcategorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {filters.category &&
                    Object.entries(getSubcategories(filters.category as ClothingCategory)).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label as string}
                        </SelectItem>
                      )
                    )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-size">Tamanho (lista)</Label>
              <Select
                value={filters.sizeOptionId || undefined}
                onValueChange={(value) => setFilters({ ...filters, sizeOptionId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tamanhos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {sizeOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-size-text">Tamanho (texto)</Label>
              <Input
                id="filter-size-text"
                value={filters.sizeText}
                onChange={(e) => setFilters({ ...filters, sizeText: e.target.value })}
                placeholder="Ex: 6-9 meses"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-colors">Cores</Label>
              <Input
                id="filter-colors"
                value={filters.colors}
                onChange={(e) => setFilters({ ...filters, colors: e.target.value })}
                placeholder="Filtrar por cor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-status">Estado</Label>
              <Select
                value={filters.status || undefined}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="IN_USE">Em uso</SelectItem>
                  <SelectItem value="FUTURE_USE">Uso futuro</SelectItem>
                  <SelectItem value="RETIRED">Retirado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-disposition">Disposição</Label>
              <Select
                value={filters.disposition || undefined}
                onValueChange={(value) => setFilters({ ...filters, disposition: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as disposições" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="KEEP">Manter</SelectItem>
                  <SelectItem value="SOLD">Vendido</SelectItem>
                  <SelectItem value="GIVEN_AWAY">Oferecido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Resultados */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">Nenhuma peça encontrada com os filtros aplicados</p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([category, categoryItems]) => {
            const isExpanded = expandedCategories.has(category)
            const items = categoryItems as any[]
            return (
              <div key={category} className="bg-white rounded-lg shadow">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex justify-between items-center p-6 hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-xl font-semibold text-gray-800">
                    {getCategoryLabel(category as ClothingCategory)}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({items.length})
                    </span>
                  </h3>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((item) => {
                        const colors = JSON.parse(item.colors || '[]')

                        return (
                          <div
                            key={item.id}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            {item.photo && (
                              <img
                                src={item.photo}
                                alt={item.subcategory}
                                className="w-full h-48 object-cover rounded mb-3"
                              />
                            )}
                            <div className="space-y-2">
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {getSubcategoryLabel(
                                    category as ClothingCategory,
                                    item.subcategory
                                  )}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Tamanho: {item.sizeOption?.label || item.size || '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  Cores: {colors.join(', ') || 'N/A'}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    item.status === 'IN_USE'
                                      ? 'bg-green-100 text-green-800'
                                      : item.status === 'FUTURE_USE'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {statusLabels[item.status as keyof typeof statusLabels]}
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    item.disposition === 'KEEP'
                                      ? 'bg-purple-100 text-purple-800'
                                      : item.disposition === 'SOLD'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-orange-100 text-orange-800'
                                  }`}
                                >
                                  {dispositionLabels[item.disposition as keyof typeof dispositionLabels]}
                                </span>
                              </div>
                              <div className="flex space-x-2 mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingItem(item)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setTransferringItem(item)}
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {editingItem && (
        <EditClothingItemDialog
          item={editingItem}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          sizeOptions={sizeOptions}
        />
      )}

      {transferringItem && (
        <TransferItemDialog
          item={transferringItem}
          currentChildId={childId}
          isOpen={!!transferringItem}
          onClose={() => setTransferringItem(null)}
        />
      )}
    </div>
  )
}
