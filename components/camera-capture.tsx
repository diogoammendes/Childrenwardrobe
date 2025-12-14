'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Camera, X, Check, RotateCcw } from 'lucide-react'

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
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [stream])

  const startCamera = useCallback(async () => {
    // Parar câmara existente primeiro
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }
    
    try {
      // Pedir resolução alta para melhor qualidade
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
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
  }, [facingMode, stream])

  useEffect(() => {
    startCamera()
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reiniciar câmara quando facingMode muda
  useEffect(() => {
    if (stream) {
      startCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode])

  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video ou canvas não disponível')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current

    // Verificar se o vídeo está pronto
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.error('Vídeo não está pronto')
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      console.error('Contexto do canvas não disponível')
      return
    }

    // Usar dimensões reais do vídeo para máxima qualidade
    const videoWidth = video.videoWidth || 1280
    const videoHeight = video.videoHeight || 720
    
    canvas.width = videoWidth
    canvas.height = videoHeight

    // Desenhar frame do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Converter para base64 com qualidade alta (0.95)
    const photoData = canvas.toDataURL('image/jpeg', 0.95)
    if (photoData && photoData !== 'data:,') {
      setCapturedPhotos((prev) => [...prev, photoData])
      setIsCapturing(true)

      // Pequeno delay para feedback visual
      setTimeout(() => {
        setIsCapturing(false)
      }, 200)
    } else {
      console.error('Erro ao capturar foto')
      setError('Erro ao capturar foto. Tente novamente.')
    }
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
    <div className="flex flex-col h-full max-h-[85vh] overflow-hidden">
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
          {/* Preview da câmara - área fixa */}
          <div className="relative bg-black rounded-lg overflow-hidden flex-shrink-0 aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {isCapturing && (
              <div className="absolute inset-0 bg-white opacity-50 flex items-center justify-center">
                <div className="text-2xl font-bold text-black">📸</div>
              </div>
            )}
            {/* Botão trocar câmara */}
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={switchCamera}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
            >
              <RotateCcw className="h-4 w-4 text-white" />
            </Button>
            {/* Canvas oculto para captura */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Botão principal de captura */}
          <div className="flex justify-center py-3 flex-shrink-0">
            <Button
              type="button"
              onClick={takePhoto}
              className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              disabled={!stream}
            >
              <Camera className="h-6 w-6" />
            </Button>
          </div>

          {/* Fotos capturadas - área com scroll */}
          {capturedPhotos.length > 0 && (
            <div className="flex-1 min-h-0 overflow-hidden px-1">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Fotos capturadas ({capturedPhotos.length})
              </Label>
              <div className="grid grid-cols-4 gap-1.5 max-h-[20vh] overflow-y-auto pb-2">
                {capturedPhotos.map((photo, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={photo}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover rounded border border-gray-200"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <div className="absolute bottom-0 left-0 bg-black/60 text-white text-[10px] px-1 rounded-tr">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões de ação - fixos no fundo */}
          <div className="flex gap-2 pt-3 flex-shrink-0 border-t mt-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1 h-11"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={capturedPhotos.length === 0}
              className="flex-1 h-11 bg-green-600 hover:bg-green-700"
            >
              <Check className="mr-1.5 h-4 w-4" />
              Adicionar ({capturedPhotos.length})
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
