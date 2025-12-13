'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Camera, Upload, X } from 'lucide-react'

interface PhotoUploadProps {
  value?: string // URL ou base64
  onChange: (value: string) => void
  label?: string
}

export default function PhotoUpload({ value, onChange, label = 'Foto' }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um ficheiro de imagem')
      return
    }

    // Limitar tamanho a 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter menos de 5MB')
      return
    }

    setUploading(true)

    try {
      // Converter para base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setPreview(base64String)
        onChange(base64String)
        setUploading(false)
      }
      reader.onerror = () => {
        alert('Erro ao ler o ficheiro')
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      alert('Erro ao processar a imagem')
      setUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleCameraInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Carregar do PC
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera className="h-4 w-4 mr-2" />
                Tirar Foto
              </Button>
            </div>
            {uploading && (
              <p className="text-sm text-gray-500">A processar imagem...</p>
            )}
          </div>
        </div>
      )}

      {/* Input oculto para ficheiro */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Input oculto para câmera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraInputChange}
        className="hidden"
      />

      {/* Opção para URL manual (opcional) */}
      {!preview && (
        <div className="text-xs text-gray-500 text-center">
          Ou pode inserir uma URL manualmente no campo abaixo
        </div>
      )}
    </div>
  )
}




