'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import AddClothingItemDialog from './add-clothing-item-dialog'
import ClothingItemsList from './clothing-items-list'

export default function ChildWardrobe({ childId, items }: { childId: string; items: any[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Guarda-Roupa</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Peça
        </Button>
      </div>

      <ClothingItemsList childId={childId} items={items} />

      <AddClothingItemDialog
        childId={childId}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  )
}

