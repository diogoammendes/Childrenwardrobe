'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Camera, X, Check } from 'lucide-react'

interface CameraCaptureProps {
  onCapture: (photos: string[]) => void
  onClose: () => void
  existingPhotos: string[]
}

export default function CameraCapture({
  onCapture,
  onClose,
  existingPhotos = [],
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>(existingPhotos)
  const [error, setError] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Câmara traseira em mobile
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setError('')
    } catch (err: any) {
      console.error('Erro ao aceder à câmara:', err)
      setError(
        err.name === 'NotAllowedError'
          ? 'Permissão de câmara negada. Por favor, permita o acesso à câmara nas definições do browser.'
          : 'Erro ao aceder à câmara. Verifique se a câmara está disponível.'
      )
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Ajustar dimensões do canvas ao vídeo
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Desenhar frame do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Converter para base64
    const photoData = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedPhotos((prev) => [...prev, photoData])
    setIsCapturing(true)

    // Pequeno delay para feedback visual
    setTimeout(() => {
      setIsCapturing(false)
    }, 200)
  }

  const removePhoto = (index: number) => {
    setCapturedPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    stopCamera()
    onCapture(capturedPhotos)
  }

  const handleCancel = () => {
    stopCamera()
    onClose()
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="mt-3"
          >
            Fechar
          </Button>
        </div>
      ) : (
        <>
          {/* Preview da câmara */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto max-h-[400px] object-cover"
            />
            {isCapturing && (
              <div className="absolute inset-0 bg-white opacity-50 flex items-center justify-center">
                <div className="text-2xl font-bold text-black">📸</div>
              </div>
            )}
          </div>

          {/* Fotos capturadas */}
          {capturedPhotos.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Fotos capturadas ({capturedPhotos.length})
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
                {capturedPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              onClick={takePhoto}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600"
              disabled={!stream}
            >
              <Camera className="mr-2 h-4 w-4" />
              Tirar Foto
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={capturedPhotos.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="mr-2 h-4 w-4" />
              Adicionar {capturedPhotos.length > 0 && `(${capturedPhotos.length})`}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

