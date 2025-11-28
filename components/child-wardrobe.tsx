'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Image } from 'lucide-react'
import AddClothingItemDialog from './add-clothing-item-dialog'
import AddMultipleClothingItemsDialog from './add-multiple-clothing-items-dialog'
import ClothingItemsList from './clothing-items-list'
import CategoryMinimums from './category-minimums'

type SizeOption = {
  id: string
  label: string
}

export default function ChildWardrobe({ 
  childId, 
  items,
  minimums = [],
  sizeOptions = [],
}: { 
  childId: string
  items: any[]
  minimums?: any[]
  sizeOptions?: SizeOption[]
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMultipleDialogOpen, setIsMultipleDialogOpen] = useState(false)

  return (
    <div className="space-y-8">
      {/* Mínimos por Categoria - Acima do Guarda-Roupa */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-indigo-100 rounded-lg mr-3">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Mínimos por Categoria
          </h2>
        </div>
        <CategoryMinimums childId={childId} minimums={minimums} />
      </div>

      {/* Guarda-Roupa */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Guarda-Roupa
            </h2>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => setIsDialogOpen(true)}
              variant="outline"
              className="border-gray-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Peça
            </Button>
            <Button 
              onClick={() => setIsMultipleDialogOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
            >
              <Image className="mr-2 h-4 w-4" />
              Adicionar Múltiplas
            </Button>
          </div>
        </div>
        <ClothingItemsList childId={childId} items={items} sizeOptions={sizeOptions} />
      </div>

      <AddClothingItemDialog
        childId={childId}
        sizeOptions={sizeOptions}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
      
      <AddMultipleClothingItemsDialog
        childId={childId}
        sizeOptions={sizeOptions}
        isOpen={isMultipleDialogOpen}
        onClose={() => setIsMultipleDialogOpen(false)}
      />
    </div>
  )
}

