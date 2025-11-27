'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getCategoryLabel, getSubcategoryLabel, CLOTHING_CATEGORIES, type ClothingCategory } from '@/lib/clothing-categories'
import { Edit, Trash2, ArrowRight } from 'lucide-react'
import EditClothingItemDialog from './edit-clothing-item-dialog'
import TransferItemDialog from './transfer-item-dialog'

export default function ClothingItemsList({ childId, items }: { childId: string; items: any[] }) {
  const router = useRouter()
  const [editingItem, setEditingItem] = useState<any>(null)
  const [transferringItem, setTransferringItem] = useState<any>(null)

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

  const groupedItems = items.reduce((acc, item) => {
    const category = item.category as ClothingCategory
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, any[]>)

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500 mb-4">Ainda não há peças de roupa adicionadas</p>
        <p className="text-sm text-gray-400">Comece por adicionar a primeira peça</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <div key={category} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            {getCategoryLabel(category as ClothingCategory)}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(categoryItems as any[]).map((item) => {
              const colors = JSON.parse(item.colors || '[]')
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
                      <p className="text-sm text-gray-600">Tamanho: {item.size}</p>
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
      ))}

      {editingItem && (
        <EditClothingItemDialog
          item={editingItem}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
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

