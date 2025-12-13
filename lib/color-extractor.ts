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
 * Detecta e remove o fundo da imagem
 * Retorna apenas pixels que provavelmente pertencem à peça de roupa
 */
function removeBackground(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): Array<{ r: number; g: number; b: number }> {
  const foregroundPixels: Array<{ r: number; g: number; b: number }> = []
  
  // Estratégia 1: Detectar fundo por bordas (geralmente fundo está nas bordas)
  const edgePixels: Array<{ r: number; g: number; b: number }> = []
  const edgeSize = Math.min(5, Math.floor(width * 0.05), Math.floor(height * 0.05))
  
  // Coletar pixels das bordas
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isEdge = x < edgeSize || x >= width - edgeSize || y < edgeSize || y >= height - edgeSize
      
      if (isEdge) {
        const idx = (y * width + x) * 4
        const r = pixels[idx]
        const g = pixels[idx + 1]
        const b = pixels[idx + 2]
        const a = pixels[idx + 3]
        
        if (a > 128) {
          edgePixels.push({ r, g, b })
        }
      }
    }
  }
  
  // Calcular cor média do fundo (bordas)
  if (edgePixels.length > 0) {
    let sumR = 0, sumG = 0, sumB = 0
    for (const pixel of edgePixels) {
      sumR += pixel.r
      sumG += pixel.g
      sumB += pixel.b
    }
    const bgR = sumR / edgePixels.length
    const bgG = sumG / edgePixels.length
    const bgB = sumB / edgePixels.length
    
    // Calcular desvio padrão do fundo
    let varianceR = 0, varianceG = 0, varianceB = 0
    for (const pixel of edgePixels) {
      varianceR += Math.pow(pixel.r - bgR, 2)
      varianceG += Math.pow(pixel.g - bgG, 2)
      varianceB += Math.pow(pixel.b - bgB, 2)
    }
    const stdDevR = Math.sqrt(varianceR / edgePixels.length)
    const stdDevG = Math.sqrt(varianceG / edgePixels.length)
    const stdDevB = Math.sqrt(varianceB / edgePixels.length)
    
    // Threshold: 2.5 desvios padrão (cobre ~99% do fundo)
    const thresholdR = stdDevR * 2.5
    const thresholdG = stdDevG * 2.5
    const thresholdB = stdDevB * 2.5
    
    // Filtrar pixels que não são fundo
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const r = pixels[idx]
        const g = pixels[idx + 1]
        const b = pixels[idx + 2]
        const a = pixels[idx + 3]
        
        if (a < 128) continue
        
        // Calcular distância do pixel ao fundo
        const distR = Math.abs(r - bgR)
        const distG = Math.abs(g - bgG)
        const distB = Math.abs(b - bgB)
        
        // Se o pixel está muito longe do fundo, é parte da peça
        if (distR > thresholdR || distG > thresholdG || distB > thresholdB) {
          foregroundPixels.push({ r, g, b })
        }
      }
    }
  } else {
    // Se não há bordas suficientes, usar método alternativo
    // Remover pixels muito claros ou muito escuros uniformes (típicos de fundos)
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      const a = pixels[i + 3]
      
      if (a < 128) continue
      
      const brightness = (r + g + b) / 3
      const diff = Math.max(r, g, b) - Math.min(r, g, b)
      
      // Ignorar fundos muito uniformes (branco, preto, cinza claro)
      if (diff < 15 && (brightness > 240 || brightness < 20)) {
        continue
      }
      
      foregroundPixels.push({ r, g, b })
    }
  }
  
  return foregroundPixels
}

/**
 * Extrai a cor dominante de uma imagem, removendo o fundo primeiro
 */
export async function extractDominantColor(imageSrc: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          resolve(null)
          return
        }
        
        const maxSize = 200
        const ratio = Math.min(maxSize / img.width, maxSize / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const pixels = imageData.data
        
        // PASSO 1: Remover fundo e obter apenas pixels da peça
        const foregroundPixels = removeBackground(pixels, canvas.width, canvas.height)
        
        if (foregroundPixels.length === 0) {
          // Se não conseguiu remover fundo, usar todos os pixels válidos
          for (let i = 0; i < pixels.length; i += 4) {
            const a = pixels[i + 3]
            if (a > 128) {
              foregroundPixels.push({
                r: pixels[i],
                g: pixels[i + 1],
                b: pixels[i + 2]
              })
            }
          }
        }
        
        if (foregroundPixels.length === 0) {
          resolve(null)
          return
        }
        
        // PASSO 2: Agrupar cores similares da peça
        const colorBuckets = new Map<string, { r: number; g: number; b: number; count: number }>()
        
        for (const pixel of foregroundPixels) {
          // Quantizar cores para agrupar similares (16 níveis)
          const quantizedR = Math.floor(pixel.r / 16) * 16
          const quantizedG = Math.floor(pixel.g / 16) * 16
          const quantizedB = Math.floor(pixel.b / 16) * 16
          const bucketKey = `${quantizedR},${quantizedG},${quantizedB}`
          
          if (colorBuckets.has(bucketKey)) {
            const bucket = colorBuckets.get(bucketKey)!
            bucket.r += pixel.r
            bucket.g += pixel.g
            bucket.b += pixel.b
            bucket.count++
          } else {
            colorBuckets.set(bucketKey, {
              r: pixel.r,
              g: pixel.g,
              b: pixel.b,
              count: 1
            })
          }
        }
        
        // PASSO 3: Encontrar a cor mais dominante na peça
        const bucketsArray = Array.from(colorBuckets.values())
        if (bucketsArray.length === 0) {
          resolve(null)
          return
        }
        
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
        
        // PASSO 4: Converter para nome de cor
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
 * Converte RGB para nome de cor em português
 */
function rgbToColorName(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min
  const brightness = (r + g + b) / 3
  
  // ========== PRIORIDADE 1: CORES NEUTRAS ==========
  if (r >= 230 && g >= 230 && b >= 230 && diff <= 30) {
    return 'Branco'
  }
  
  if (r <= 50 && g <= 50 && b <= 50 && diff <= 30) {
    return 'Preto'
  }
  
  if (diff <= 30 && brightness >= 60 && brightness <= 200) {
    return 'Cinza'
  }
  
  // ========== PRIORIDADE 2: Análise HSV ==========
  const hsv = rgbToHsv(r, g, b)
  const { h, s, v } = hsv
  
  if (v < 25) return 'Preto'
  if (v > 85 && s < 20) return 'Branco'
  if (s < 20 && v >= 25 && v <= 85) return 'Cinza'
  
  // ========== PRIORIDADE 3: Cores com baixa saturação ==========
  if (s < 30) {
    if (v > 70) return 'Bege'
    if (v < 40) return 'Castanho'
    return 'Cinza'
  }
  
  // ========== PRIORIDADE 4: Cores saturadas por matiz ==========
  
  // Vermelho: 0-25° e 335-360°
  if ((h >= 0 && h < 25) || (h >= 335 && h <= 360)) {
    if (v < 35 && s > 40) return 'Bordô'
    if (v < 50 && s > 50) return 'Vermelho'
    if (s > 50) return 'Vermelho'
    if (v > 60) return 'Rosa'
    return 'Vermelho'
  }
  
  // Laranja: 25-45°
  if (h >= 25 && h < 45) {
    if (s > 45 && v > 35) return 'Laranja'
    if (v < 40) return 'Castanho'
    return 'Laranja'
  }
  
  // Amarelo: 45-70°
  if (h >= 45 && h < 70) {
    if (s > 35) return 'Amarelo'
    return 'Bege'
  }
  
  // Verde: 70-160°
  if (h >= 70 && h < 160) {
    if (v > 65 && s > 45) return 'Verde Claro'
    if (s > 35) return 'Verde'
    return 'Verde'
  }
  
  // Ciano/Azul claro: 160-200°
  if (h >= 160 && h < 200) {
    if (v > 65) return 'Azul Claro'
    return 'Azul'
  }
  
  // Azul: 200-260°
  if (h >= 200 && h < 260) {
    if (v > 65 && s > 45) return 'Azul Claro'
    return 'Azul'
  }
  
  // Roxo/Violeta: 260-310°
  if (h >= 260 && h < 310) {
    if (s > 35) return 'Roxo'
    return 'Roxo'
  }
  
  // Rosa: 310-335°
  if (h >= 310 && h < 335) {
    if (s > 40 && v > 45) return 'Rosa'
    if (v > 65) return 'Rosa'
    return 'Roxo'
  }
  
  // ========== PRIORIDADE 5: Fallback RGB ==========
  const rDominance = r - Math.max(g, b)
  const gDominance = g - Math.max(r, b)
  const bDominance = b - Math.max(r, g)
  
  if (rDominance > 40) {
    if (brightness < 60) return 'Bordô'
    if (g > 140 && b < 100) return 'Laranja'
    if (g > 110 && b < 80) return 'Amarelo'
    return 'Vermelho'
  }
  
  if (gDominance > 40) {
    return 'Verde'
  }
  
  if (bDominance > 40) {
    return 'Azul'
  }
  
  if (diff < 40) {
    if (brightness > 200) return 'Branco'
    if (brightness < 60) return 'Preto'
    return 'Cinza'
  }
  
  if (r >= g && r >= b) {
    if (brightness < 60) return 'Bordô'
    if (brightness > 200) return 'Branco'
    return 'Vermelho'
  } else if (g >= r && g >= b) {
    if (brightness < 60) return 'Verde'
    return 'Verde'
  } else {
    if (brightness < 60) return 'Azul'
    return 'Azul'
  }
}
