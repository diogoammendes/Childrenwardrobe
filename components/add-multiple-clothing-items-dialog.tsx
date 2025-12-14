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
import CameraCapture from './camera-capture'
import { extractDominantColor } from '@/lib/color-extractor'

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
  
  const [step, setStep] = useState<'category' | 'photos' | 'review'>('category')
  const [category, setCategory] = useState<ClothingCategory | ''>('')
  const [photos, setPhotos] = useState<string[]>([])
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [creatingItems, setCreatingItems] = useState<Set<string>>(new Set())
  const [discardedItems, setDiscardedItems] = useState<Set<string>>(new Set())
  const [showCamera, setShowCamera] = useState(false)
  
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newPhotos: string[] = []
    const fileArray = Array.from(files)

    for (const file of fileArray) {
      const reader = new FileReader()
      const photoData = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          resolve(reader.result as string)
        }
        reader.readAsDataURL(file)
      })
      
      newPhotos.push(photoData)
    }
    
    setPhotos((prev) => [...prev, ...newPhotos])
  }

  const handleCameraCapture = async (capturedPhotos: string[]) => {
    setPhotos((prev) => [...prev, ...capturedPhotos])
    setShowCamera(false)
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePhotosSubmit = async () => {
    if (photos.length === 0) {
      setError('Adicione pelo menos uma foto')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Criar items pendentes com análise de cor individual para cada foto
      const items: PendingItem[] = await Promise.all(
        photos.map(async (photo, index) => {
          // Se não houver cor pré-preenchida, analisar a cor desta foto específica
          let photoColor = prefillData.colors || ''
          
          if (!photoColor.trim()) {
            try {
              const dominantColor = await extractDominantColor(photo)
              if (dominantColor) {
                photoColor = dominantColor
              }
            } catch (error) {
              console.error(`Erro ao analisar cor da foto ${index + 1}:`, error)
            }
          }

          return {
            id: `pending-${Date.now()}-${index}`,
            photo,
            subcategory: prefillData.subcategory || '',
            sizeOptionId: prefillData.sizeOptionId !== '__none__' ? prefillData.sizeOptionId : '',
            size: prefillData.size || '',
            colors: photoColor,
            status: prefillData.status,
            disposition: prefillData.disposition,
          }
        })
      )

      setPendingItems(items)
      setStep('review')
    } catch (error) {
      console.error('Erro ao processar fotos:', error)
      setError('Erro ao processar fotos. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const updatePendingItem = (id: string, updates: Partial<PendingItem>) => {
    setPendingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }

  const createItem = async (item: PendingItem, skipValidation = false) => {
    // Se não for para saltar validação, validar campos obrigatórios
    if (!skipValidation) {
      if (!item.subcategory || !item.colors) {
        setError('Preencha subcategoria e cores')
        return
      }

      // Validar que pelo menos um tamanho foi preenchido
      if (!item.sizeOptionId && !item.size?.trim()) {
        setError('Preencha pelo menos um tamanho (lista ou texto livre)')
        return
      }
    }

    setCreatingItems((prev) => new Set(prev).add(item.id))
    setError('')

    try {
      // Processar cores: se houver, converter para array; se não, null
      let colorsArray: string[] | null = null
      if (item.colors && item.colors.trim() !== '') {
        colorsArray = item.colors
          .split(',')
          .map((c) => c.trim())
          .filter((c) => c.length > 0)
        
        if (colorsArray.length === 0) {
          colorsArray = null
        }
      }

      // Normalizar sizeOptionId: __none__ vira null
      const normalizedSizeOptionId = item.sizeOptionId === '__none__' || !item.sizeOptionId ? null : item.sizeOptionId

      const response = await fetch('/api/clothing-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subcategory: item.subcategory || null,
          size: item.size?.trim() || null,
          sizeOptionId: normalizedSizeOptionId,
          colors: colorsArray,
          photo: item.photo,
          status: item.status,
          disposition: item.disposition,
          isSet: false,
          setItemId: null,
          childId,
          needsClassification: skipValidation || !item.subcategory || !colorsArray || (!normalizedSizeOptionId && !item.size?.trim()),
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

  // Função para guardar item sem classificação completa
  const saveItemWithoutClassification = async (item: PendingItem) => {
    await createItem(item, true)
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
      <DialogContent className="sm:max-w-6xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg sm:text-2xl font-bold">
            {step === 'category' && 'Adicionar Múltiplas Peças'}
            {step === 'photos' && 'Adicionar Fotos'}
            {step === 'review' && 'Revisão e Criação'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg flex-shrink-0">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0">
          {step === 'category' && (
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-blue-800">
                  <strong>Apenas a categoria é obrigatória.</strong> Os restantes campos são opcionais e serão aplicados a todas as peças.
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

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4 pt-4 border-t">
                <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button
                  onClick={handleCategoryContinue}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 w-full sm:w-auto"
                >
                  Continuar para Fotos
                </Button>
              </div>
            </div>
          )}

          {step === 'photos' && (
            <div className="space-y-6 py-4">
              {showCamera ? (
                <CameraCapture
                  onCapture={handleCameraCapture}
                  onClose={() => setShowCamera(false)}
                  existingPhotos={photos}
                />
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-4">
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
                      onClick={() => setShowCamera(true)}
                      className="flex-1"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Tirar Fotos
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

                  {photos.length > 0 && (
                    <div>
                      <Label>Fotos selecionadas ({photos.length})</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
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
                            <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setStep('category')}
                      className="w-full sm:w-auto"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar
                    </Button>
                    <Button
                      onClick={handlePhotosSubmit}
                      disabled={photos.length === 0}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 w-full sm:w-auto"
                    >
                      Continuar para Revisão
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              {pendingItems.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full mb-4">
                    <Check className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                    Todas as peças foram processadas!
                  </h3>
                  <Button
                    onClick={handleFinish}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 w-full sm:w-auto"
                  >
                    Concluir
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {pendingItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`border-2 rounded-lg p-3 sm:p-4 transition-all ${
                        discardedItems.has(item.id)
                          ? 'opacity-50 border-gray-200 bg-gray-50'
                          : creatingItems.has(item.id)
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-300 bg-white hover:border-indigo-400'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        {/* Foto */}
                        <div className="flex-shrink-0 sm:w-1/3">
                          <div className="relative">
                            <img
                              src={item.photo}
                              alt={`Peça ${index + 1}`}
                              className="w-full h-36 sm:h-48 lg:h-56 object-cover rounded-lg border-2 border-gray-200"
                            />
                            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs sm:text-sm font-semibold">
                              #{index + 1}
                            </div>
                          </div>
                        </div>

                        {/* Formulário */}
                        <div className="flex-1 min-w-0">
                          {/* Botões de ação - sempre no topo em mobile */}
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
                            <Button
                              size="sm"
                              onClick={() => createItem(item)}
                              disabled={
                                creatingItems.has(item.id) || 
                                !item.subcategory || 
                                !item.colors ||
                                (!item.sizeOptionId && !item.size?.trim())
                              }
                              className="bg-green-600 hover:bg-green-700 h-9 px-2 sm:px-3 text-xs sm:text-sm"
                            >
                              {creatingItems.has(item.id) ? (
                                '...'
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5 sm:mr-1" />
                                  <span className="hidden sm:inline">Criar</span>
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveItemWithoutClassification(item)}
                              disabled={creatingItems.has(item.id)}
                              variant="outline"
                              className="border-orange-500 text-orange-600 hover:bg-orange-50 h-9 px-2 sm:px-3 text-xs sm:text-sm"
                            >
                              {creatingItems.has(item.id) ? (
                                '...'
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5 sm:mr-1" />
                                  <span className="hidden sm:inline">Guardar</span>
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => discardItem(item)}
                              disabled={creatingItems.has(item.id)}
                              className="h-9 px-2 sm:px-3"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          <div className="space-y-2.5 sm:space-y-3">
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
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-4 border-t flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('photos')
                      setPendingItems([])
                    }}
                    className="order-2 sm:order-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <div className="text-xs sm:text-sm text-gray-600 text-center order-1 sm:order-2">
                    {pendingItems.length} peça(s) pendente(s)
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleFinish}
                    className="order-3"
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

