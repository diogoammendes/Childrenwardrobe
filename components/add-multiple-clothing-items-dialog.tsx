'use client'

import { useState, useRef } from 'react'
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
import { Camera, Upload, X, Check, Trash2, ArrowLeft } from 'lucide-react'

type SizeOption = {
  id: string
  label: string
}

type PendingItem = {
  id: string
  photo: string
  subcategory: string
  sizeOptionId: string
  size: string
  colors: string
  status: 'RETIRED' | 'IN_USE' | 'FUTURE_USE'
  disposition: 'KEEP' | 'SOLD' | 'GIVEN_AWAY'
}

export default function AddMultipleClothingItemsDialog({
  childId,
  isOpen,
  onClose,
  sizeOptions = [],
}: {
  childId: string
  isOpen: boolean
  onClose: () => void
  sizeOptions?: SizeOption[]
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  const [step, setStep] = useState<'category' | 'photos' | 'review'>('category')
  const [category, setCategory] = useState<ClothingCategory | ''>('')
  const [photos, setPhotos] = useState<string[]>([])
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [creatingItems, setCreatingItems] = useState<Set<string>>(new Set())
  const [discardedItems, setDiscardedItems] = useState<Set<string>>(new Set())
  
  // Campos pré-preenchidos (opcionais)
  const [prefillData, setPrefillData] = useState({
    subcategory: '',
    sizeOptionId: '__none__',
    size: '',
    colors: '',
    status: 'IN_USE' as 'RETIRED' | 'IN_USE' | 'FUTURE_USE',
    disposition: 'KEEP' as 'KEEP' | 'SOLD' | 'GIVEN_AWAY',
  })

  const subcategories = category ? getSubcategories(category) : {}

  const handleCategoryContinue = () => {
    if (!category) {
      setError('Selecione uma categoria')
      return
    }
    setStep('photos')
    setError('')
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newPhotos: string[] = []
    const fileArray = Array.from(files)

    fileArray.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newPhotos.push(reader.result as string)
        if (newPhotos.length === fileArray.length) {
          setPhotos((prev) => [...prev, ...newPhotos])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotos((prev) => [...prev, reader.result as string])
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePhotosSubmit = () => {
    if (photos.length === 0) {
      setError('Adicione pelo menos uma foto')
      return
    }

    // Criar items pendentes com valores pré-preenchidos (ou padrão se não preenchidos)
    const items: PendingItem[] = photos.map((photo, index) => ({
      id: `pending-${Date.now()}-${index}`,
      photo,
      subcategory: prefillData.subcategory || '',
      sizeOptionId: prefillData.sizeOptionId !== '__none__' ? prefillData.sizeOptionId : '',
      size: prefillData.size || '',
      colors: prefillData.colors || '',
      status: prefillData.status,
      disposition: prefillData.disposition,
    }))

    setPendingItems(items)
    setStep('review')
    setError('')
  }

  const updatePendingItem = (id: string, updates: Partial<PendingItem>) => {
    setPendingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }

  const createItem = async (item: PendingItem) => {
    if (!item.subcategory || !item.colors) {
      setError('Preencha subcategoria e cores')
      return
    }

    // Validar que pelo menos um tamanho foi preenchido
    if (!item.sizeOptionId && !item.size?.trim()) {
      setError('Preencha pelo menos um tamanho (lista ou texto livre)')
      return
    }

    setCreatingItems((prev) => new Set(prev).add(item.id))
    setError('')

    try {
      const colorsArray = item.colors
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.length > 0)

      if (colorsArray.length === 0) {
        throw new Error('Adicione pelo menos uma cor')
      }

      // Normalizar sizeOptionId: __none__ vira null
      const normalizedSizeOptionId = item.sizeOptionId === '__none__' || !item.sizeOptionId ? null : item.sizeOptionId

      const response = await fetch('/api/clothing-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subcategory: item.subcategory,
          size: item.size?.trim() || null,
          sizeOptionId: normalizedSizeOptionId,
          colors: colorsArray,
          photo: item.photo,
          status: item.status,
          disposition: item.disposition,
          isSet: false,
          setItemId: null,
          childId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao criar peça')
      }

      // Remover item da lista e a foto correspondente
      const itemIndex = pendingItems.findIndex((p) => p.id === item.id)
      setPendingItems((prev) => prev.filter((i) => i.id !== item.id))
      setPhotos((prev) => prev.filter((_, index) => index !== itemIndex))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreatingItems((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    }
  }

  const discardItem = (item: PendingItem) => {
    setDiscardedItems((prev) => new Set(prev).add(item.id))
    const itemIndex = pendingItems.findIndex((p) => p.id === item.id)
    setPendingItems((prev) => prev.filter((i) => i.id !== item.id))
    setPhotos((prev) => prev.filter((_, index) => index !== itemIndex))
  }

  const handleClose = () => {
    setStep('category')
    setCategory('')
    setPhotos([])
    setPendingItems([])
    setError('')
    setCreatingItems(new Set())
    setDiscardedItems(new Set())
    setPrefillData({
      subcategory: '',
      sizeOptionId: '__none__',
      size: '',
      colors: '',
      status: 'IN_USE',
      disposition: 'KEEP',
    })
    onClose()
  }

  const handleFinish = () => {
    router.refresh()
    handleClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {step === 'category' && 'Adicionar Múltiplas Peças'}
            {step === 'photos' && 'Adicionar Fotos'}
            {step === 'review' && 'Revisão e Criação'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {step === 'category' && (
            <div className="space-y-6 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Apenas a categoria é obrigatória.</strong> Os restantes campos são opcionais e serão aplicados a todas as peças. Pode também deixar em branco e preencher individualmente na revisão.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={category}
                    onValueChange={(value) => {
                      setCategory(value as ClothingCategory)
                      setPrefillData(prev => ({ ...prev, subcategory: '' })) // Reset subcategory when category changes
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

                <div className="space-y-2">
                  <Label htmlFor="prefill-subcategory">Subcategoria</Label>
                  <Select
                    value={prefillData.subcategory}
                    onValueChange={(value) =>
                      setPrefillData({ ...prefillData, subcategory: value })
                    }
                    disabled={!category}
                  >
                    <SelectTrigger id="prefill-subcategory">
                      <SelectValue placeholder="Opcional - selecione a subcategoria" />
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

                <div className="space-y-2">
                  <Label htmlFor="prefill-size-option">Tamanho (lista)</Label>
                  <Select
                    value={prefillData.sizeOptionId}
                    onValueChange={(value) =>
                      setPrefillData({ ...prefillData, sizeOptionId: value })
                    }
                  >
                    <SelectTrigger id="prefill-size-option">
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sem tamanho</SelectItem>
                      {sizeOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prefill-size-text">Tamanho (texto livre)</Label>
                  <Input
                    id="prefill-size-text"
                    value={prefillData.size}
                    onChange={(e) =>
                      setPrefillData({ ...prefillData, size: e.target.value })
                    }
                    placeholder="Opcional. Ex: 2 anos, 86, M"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prefill-colors">Cores (separadas por vírgula)</Label>
                  <Input
                    id="prefill-colors"
                    value={prefillData.colors}
                    onChange={(e) =>
                      setPrefillData({ ...prefillData, colors: e.target.value })
                    }
                    placeholder="Opcional. Ex: Azul, Branco"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prefill-status">Estado</Label>
                    <Select
                      value={prefillData.status}
                      onValueChange={(value: any) =>
                        setPrefillData({ ...prefillData, status: value })
                      }
                    >
                      <SelectTrigger id="prefill-status">
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
                    <Label htmlFor="prefill-disposition">Disposição</Label>
                    <Select
                      value={prefillData.disposition}
                      onValueChange={(value: any) =>
                        setPrefillData({ ...prefillData, disposition: value })
                      }
                    >
                      <SelectTrigger id="prefill-disposition">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KEEP">Manter</SelectItem>
                        <SelectItem value="SOLD">Vendido</SelectItem>
                        <SelectItem value="GIVEN_AWAY">Oferecido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCategoryContinue}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600"
                >
                  Continuar para Fotos
                </Button>
              </div>
            </div>
          )}

          {step === 'photos' && (
            <div className="space-y-6 py-4">
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Carregar Fotos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Tirar Foto
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
              />

              {photos.length > 0 && (
                <div>
                  <Label>Fotos selecionadas ({photos.length})</Label>
                  <div className="grid grid-cols-4 gap-4 mt-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setStep('category')}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar
                    </Button>
                    <Button
                      onClick={handlePhotosSubmit}
                      disabled={photos.length === 0}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600"
                    >
                      Continuar para Revisão
                    </Button>
                  </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6 py-4">
              {pendingItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Todas as peças foram processadas!
                  </h3>
                  <Button
                    onClick={handleFinish}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600"
                  >
                    Concluir
                  </Button>
                </div>
              ) : (
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                  {pendingItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`border-2 rounded-lg p-4 transition-all ${
                        discardedItems.has(item.id)
                          ? 'opacity-50 border-gray-200 bg-gray-50'
                          : creatingItems.has(item.id)
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-300 bg-white hover:border-indigo-400'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row gap-4">
                        {/* Foto */}
                        <div className="flex-shrink-0 lg:w-1/3">
                          <div className="relative">
                            <img
                              src={item.photo}
                              alt={`Peça ${index + 1}`}
                              className="w-full h-48 lg:h-64 object-cover rounded-lg border-2 border-gray-200"
                            />
                            <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm font-semibold">
                              Peça {index + 1}
                            </div>
                          </div>
                        </div>

                        {/* Formulário */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                            <h4 className="font-semibold text-gray-800 text-lg">
                              Peça {index + 1}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() => createItem(item)}
                                disabled={
                                  creatingItems.has(item.id) || 
                                  !item.subcategory || 
                                  !item.colors ||
                                  (!item.sizeOptionId && !item.size?.trim())
                                }
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {creatingItems.has(item.id) ? (
                                  'A criar...'
                                ) : (
                                  <>
                                    <Check className="mr-1 h-3 w-3" />
                                    Criar
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => discardItem(item)}
                                disabled={creatingItems.has(item.id)}
                              >
                                <Trash2 className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Eliminar</span>
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Subcategoria *</Label>
                              <Select
                                value={item.subcategory}
                                onValueChange={(value) =>
                                  updatePendingItem(item.id, { subcategory: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Tamanho (lista)</Label>
                                <Select
                                  value={item.sizeOptionId}
                                  onValueChange={(value) =>
                                    updatePendingItem(item.id, { sizeOptionId: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Opcional" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">Sem tamanho</SelectItem>
                                    {sizeOptions.map((option) => (
                                      <SelectItem key={option.id} value={option.id}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Tamanho (texto livre)</Label>
                                <Input
                                  value={item.size}
                                  onChange={(e) =>
                                    updatePendingItem(item.id, { size: e.target.value })
                                  }
                                  placeholder="Ex: 2 anos, 86, M"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Cores (separadas por vírgula) *</Label>
                              <Input
                                value={item.colors}
                                onChange={(e) =>
                                  updatePendingItem(item.id, { colors: e.target.value })
                                }
                                placeholder="Ex: Azul, Branco"
                                required
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Estado</Label>
                                <Select
                                  value={item.status}
                                  onValueChange={(value: any) =>
                                    updatePendingItem(item.id, { status: value })
                                  }
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

                              <div className="space-y-1">
                                <Label className="text-xs">Disposição</Label>
                                <Select
                                  value={item.disposition}
                                  onValueChange={(value: any) =>
                                    updatePendingItem(item.id, { disposition: value })
                                  }
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
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pendingItems.length > 0 && (
                <div className="flex justify-between items-center pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('photos')
                      setPendingItems([])
                    }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <div className="text-sm text-gray-600">
                    {pendingItems.length} peça(s) pendente(s)
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleFinish}
                  >
                    Concluir
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

