'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import AddClothingItemDialog from './add-clothing-item-dialog'
import ClothingItemsList from './clothing-items-list'
import CategoryMinimums from './category-minimums'

export default function ChildWardrobe({ 
  childId, 
  items,
  minimums = []
}: { 
  childId: string
  items: any[]
  minimums?: any[]
}) {
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

      <Tabs defaultValue="items" className="w-full">
        <TabsList>
          <TabsTrigger value="items">Peças de Roupa</TabsTrigger>
          <TabsTrigger value="minimums">Mínimos por Categoria</TabsTrigger>
        </TabsList>
        
        <TabsContent value="items">
          <ClothingItemsList childId={childId} items={items} />
        </TabsContent>
        
        <TabsContent value="minimums">
          <CategoryMinimums childId={childId} minimums={minimums} />
        </TabsContent>
      </Tabs>

      <AddClothingItemDialog
        childId={childId}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  )
}

