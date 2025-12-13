/**
 * Converte RGB para HSV
 */
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min

  let h = 0
  const s = max === 0 ? 0 : diff / max
  const v = max

  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff + (g < b ? 6 : 0)) / 6
    } else if (max === g) {
      h = ((b - r) / diff + 2) / 6
    } else {
      h = ((r - g) / diff + 4) / 6
    }
  }

  return { h: h * 360, s: s * 100, v: v * 100 }
}

/**
 * Extrai a cor dominante de uma imagem
 */
export async function extractDominantColor(imageSrc: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      try {
        // Criar canvas temporário
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          resolve(null)
          return
        }
        
        // Redimensionar imagem para análise mais rápida (máx 150x150 para melhor precisão)
        const maxSize = 150
        const ratio = Math.min(maxSize / img.width, maxSize / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        
        // Desenhar imagem no canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Obter dados de pixel
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const pixels = imageData.data
        
        // Agrupar cores similares em buckets
        const colorBuckets: Map<string, { r: number; g: number; b: number; count: number }> = new Map()
        
        for (let i = 0; i < pixels.length; i += 4) {
          const pixelR = pixels[i]
          const pixelG = pixels[i + 1]
          const pixelB = pixels[i + 2]
          const pixelA = pixels[i + 3]
          
          // Ignorar pixels transparentes
          if (pixelA < 128) continue
          
          // Ignorar pixels muito claros (branco/fundo) ou muito escuros (sombra)
          const brightness = (pixelR + pixelG + pixelB) / 3
          if (brightness < 25 || brightness > 245) continue
          
          // Quantizar cores para agrupar similares (reduzir para 32 níveis)
          const quantizedR = Math.floor(pixelR / 8) * 8
          const quantizedG = Math.floor(pixelG / 8) * 8
          const quantizedB = Math.floor(pixelB / 8) * 8
          const bucketKey = `${quantizedR},${quantizedG},${quantizedB}`
          
          if (colorBuckets.has(bucketKey)) {
            const bucket = colorBuckets.get(bucketKey)!
            bucket.r += pixelR
            bucket.g += pixelG
            bucket.b += pixelB
            bucket.count++
          } else {
            colorBuckets.set(bucketKey, { r: pixelR, g: pixelG, b: pixelB, count: 1 })
          }
        }
        
        if (colorBuckets.size === 0) {
          resolve(null)
          return
        }
        
        // Encontrar o bucket com mais pixels (cor mais dominante)
        const bucketsArray = Array.from(colorBuckets.values())
        let dominantBucket = bucketsArray[0]
        let maxCount = dominantBucket.count
        
        for (let i = 1; i < bucketsArray.length; i++) {
          const bucket = bucketsArray[i]
          if (bucket.count > maxCount) {
            maxCount = bucket.count
            dominantBucket = bucket
          }
        }
        
        // Calcular média da cor dominante
        const avgR = Math.round(dominantBucket.r / dominantBucket.count)
        const avgG = Math.round(dominantBucket.g / dominantBucket.count)
        const avgB = Math.round(dominantBucket.b / dominantBucket.count)
        
        // Converter RGB para nome de cor
        const colorName = rgbToColorName(avgR, avgG, avgB)
        resolve(colorName)
      } catch (error) {
        console.error('Erro ao extrair cor:', error)
        resolve(null)
      }
    }
    
    img.onerror = () => {
      resolve(null)
    }
    
    img.src = imageSrc
  })
}

/**
 * Converte RGB para nome de cor em português usando análise HSV
 */
function rgbToColorName(r: number, g: number, b: number): string {
  const hsv = rgbToHsv(r, g, b)
  const { h, s, v } = hsv
  
  // Cores muito escuras ou muito claras
  if (v < 15) return 'Preto'
  if (v > 95 && s < 10) return 'Branco'
  if (s < 15 && v > 20 && v < 80) return 'Cinza'
  
  // Cores com baixa saturação (tons de terra, bege, etc)
  if (s < 30) {
    if (v > 70) return 'Bege'
    if (v < 40) return 'Castanho'
    return 'Cinza'
  }
  
  // Cores saturadas - usar matiz (hue) para identificar
  // Vermelho: 0-30 e 330-360 graus
  if ((h >= 0 && h < 30) || (h >= 330 && h <= 360)) {
    // Distinguir vermelho de castanho/laranja escuro
    if (s > 50 && v > 40) {
      // Se tem muita saturação e brilho, é vermelho
      if (h < 15 || h > 345) return 'Vermelho'
      // Laranja-vermelho
      if (h >= 15 && h < 30) return 'Laranja'
    }
    // Vermelho escuro ainda é vermelho se tiver boa saturação
    if (s > 60 && v > 25) return 'Vermelho'
    // Caso contrário pode ser castanho
    if (v < 50) return 'Castanho'
    return 'Vermelho'
  }
  
  // Laranja: 30-50 graus
  if (h >= 30 && h < 50) {
    return 'Laranja'
  }
  
  // Amarelo: 50-70 graus
  if (h >= 50 && h < 70) {
    return 'Amarelo'
  }
  
  // Verde: 70-150 graus
  if (h >= 70 && h < 150) {
    if (s < 40 || v < 50) return 'Verde'
    return v > 70 ? 'Verde Claro' : 'Verde'
  }
  
  // Ciano/Azul claro: 150-210 graus
  if (h >= 150 && h < 210) {
    return v > 70 ? 'Azul Claro' : 'Azul'
  }
  
  // Azul: 210-270 graus
  if (h >= 210 && h < 270) {
    return v > 70 ? 'Azul Claro' : 'Azul'
  }
  
  // Roxo/Violeta: 270-330 graus
  if (h >= 270 && h < 330) {
    return 'Roxo'
  }
  
  // Fallback: analisar componentes RGB dominantes
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min
  
  // Se a diferença é pequena, é uma cor neutra
  if (diff < 30) {
    if (max > 200) return 'Branco'
    if (max < 50) return 'Preto'
    return 'Cinza'
  }
  
  // Determinar cor baseada no componente dominante
  if (r > g && r > b) {
    // Vermelho dominante
    if (r > 200 && g > 100 && b < 100) return 'Laranja'
    if (g > 150 && b < 100) return 'Amarelo'
    if (r > 150 && g < 100 && b < 100) return 'Vermelho'
    if (r > 100 && g < 80 && b < 80) return 'Vermelho'
    return 'Vermelho'
  } else if (g > r && g > b) {
    return 'Verde'
  } else if (b > r && b > g) {
    return 'Azul'
  }
  
  // Último recurso
  return 'Desconhecido'
}

