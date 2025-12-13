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
 * Agrupa cores similares e retorna os clusters ordenados por frequência
 */
function clusterColors(pixels: Array<{ r: number; g: number; b: number }>): Array<{ r: number; g: number; b: number; count: number }> {
  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>()
  
  for (const pixel of pixels) {
    // Quantizar para 8 níveis (32 = 256/8)
    const qR = Math.floor(pixel.r / 32) * 32
    const qG = Math.floor(pixel.g / 32) * 32
    const qB = Math.floor(pixel.b / 32) * 32
    const key = `${qR},${qG},${qB}`
    
    if (buckets.has(key)) {
      const bucket = buckets.get(key)!
      bucket.r += pixel.r
      bucket.g += pixel.g
      bucket.b += pixel.b
      bucket.count++
    } else {
      buckets.set(key, { r: pixel.r, g: pixel.g, b: pixel.b, count: 1 })
    }
  }
  
  // Calcular média de cada bucket
  const clusters = Array.from(buckets.values()).map(b => ({
    r: Math.round(b.r / b.count),
    g: Math.round(b.g / b.count),
    b: Math.round(b.b / b.count),
    count: b.count
  }))
  
  // Ordenar por frequência (mais frequente primeiro)
  clusters.sort((a, b) => b.count - a.count)
  
  return clusters
}

/**
 * Verifica se uma cor é provavelmente fundo (branco, cinza claro, bege claro)
 */
function isLikelyBackground(r: number, g: number, b: number): boolean {
  const brightness = (r + g + b) / 3
  const diff = Math.max(r, g, b) - Math.min(r, g, b)
  
  // Branco ou quase branco
  if (brightness > 230 && diff < 30) return true
  
  // Cinza muito claro
  if (brightness > 200 && diff < 20) return true
  
  return false
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
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          resolve(null)
          return
        }
        
        const maxSize = 150
        const ratio = Math.min(maxSize / img.width, maxSize / img.height)
        canvas.width = Math.max(1, Math.floor(img.width * ratio))
        canvas.height = Math.max(1, Math.floor(img.height * ratio))
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const pixels = imageData.data
        const width = canvas.width
        const height = canvas.height
        
        // Coletar pixels do centro da imagem (onde a peça provavelmente está)
        // Usar região central (60% da imagem)
        const marginX = Math.floor(width * 0.2)
        const marginY = Math.floor(height * 0.2)
        const centerPixels: Array<{ r: number; g: number; b: number }> = []
        
        for (let y = marginY; y < height - marginY; y++) {
          for (let x = marginX; x < width - marginX; x++) {
            const idx = (y * width + x) * 4
            const r = pixels[idx]
            const g = pixels[idx + 1]
            const b = pixels[idx + 2]
            const a = pixels[idx + 3]
            
            if (a > 128) {
              centerPixels.push({ r, g, b })
            }
          }
        }
        
        // Se não há pixels centrais suficientes, usar todos
        let allPixels = centerPixels
        if (centerPixels.length < 100) {
          allPixels = []
          for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] > 128) {
              allPixels.push({
                r: pixels[i],
                g: pixels[i + 1],
                b: pixels[i + 2]
              })
            }
          }
        }
        
        if (allPixels.length === 0) {
          resolve(null)
          return
        }
        
        // Agrupar cores por similaridade
        const clusters = clusterColors(allPixels)
        
        if (clusters.length === 0) {
          resolve(null)
          return
        }
        
        // Encontrar a cor dominante que NÃO é fundo
        let dominantColor = clusters[0]
        
        for (const cluster of clusters) {
          // Se este cluster tem pelo menos 10% dos pixels e não é fundo
          const percentage = cluster.count / allPixels.length
          if (percentage >= 0.10 && !isLikelyBackground(cluster.r, cluster.g, cluster.b)) {
            dominantColor = cluster
            break
          }
        }
        
        // Se todos parecem fundo, usar o mais frequente mesmo assim
        // (pode ser uma peça branca)
        if (isLikelyBackground(dominantColor.r, dominantColor.g, dominantColor.b)) {
          // Verificar se há outra cor significativa
          for (const cluster of clusters) {
            const percentage = cluster.count / allPixels.length
            if (percentage >= 0.15 && !isLikelyBackground(cluster.r, cluster.g, cluster.b)) {
              dominantColor = cluster
              break
            }
          }
        }
        
        const colorName = rgbToColorName(dominantColor.r, dominantColor.g, dominantColor.b)
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
  
  // ========== CORES NEUTRAS (verificação direta RGB) ==========
  
  // Branco: componentes todos altos e similares
  if (r >= 220 && g >= 220 && b >= 220 && diff <= 35) {
    return 'Branco'
  }
  
  // Preto: componentes todos baixos e similares
  if (r <= 40 && g <= 40 && b <= 40) {
    return 'Preto'
  }
  
  // Cinza: componentes equilibrados
  if (diff <= 25) {
    if (brightness >= 200) return 'Branco'
    if (brightness <= 50) return 'Preto'
    if (brightness >= 150) return 'Cinza Claro'
    return 'Cinza'
  }
  
  // ========== ANÁLISE HSV ==========
  const hsv = rgbToHsv(r, g, b)
  const { h, s, v } = hsv
  
  // Preto (baixo brilho)
  if (v < 20) return 'Preto'
  
  // Branco (alto brilho, baixa saturação)
  if (v > 90 && s < 15) return 'Branco'
  
  // Cinza (baixa saturação)
  if (s < 15) {
    if (v > 70) return 'Cinza Claro'
    if (v < 30) return 'Preto'
    return 'Cinza'
  }
  
  // Cores pastéis/terra (saturação média-baixa)
  if (s < 35) {
    if (v > 75) return 'Bege'
    if (v < 35) return 'Castanho'
    return 'Cinza'
  }
  
  // ========== CORES SATURADAS (por matiz) ==========
  
  // Vermelho: 0-20° e 340-360°
  if ((h >= 0 && h < 20) || (h >= 340 && h <= 360)) {
    if (v < 30) return 'Bordô'
    if (s < 50 && v > 65) return 'Rosa'
    return 'Vermelho'
  }
  
  // Laranja: 20-45°
  if (h >= 20 && h < 45) {
    if (v < 35) return 'Castanho'
    return 'Laranja'
  }
  
  // Amarelo: 45-70°
  if (h >= 45 && h < 70) {
    if (s < 40) return 'Bege'
    return 'Amarelo'
  }
  
  // Verde: 70-160°
  if (h >= 70 && h < 160) {
    if (v > 70 && s > 50) return 'Verde Claro'
    return 'Verde'
  }
  
  // Ciano/Turquesa: 160-200°
  if (h >= 160 && h < 200) {
    if (v > 70) return 'Azul Claro'
    return 'Azul'
  }
  
  // Azul: 200-260°
  if (h >= 200 && h < 260) {
    if (v > 70 && s < 60) return 'Azul Claro'
    return 'Azul'
  }
  
  // Roxo/Violeta: 260-310°
  if (h >= 260 && h < 310) {
    return 'Roxo'
  }
  
  // Rosa/Magenta: 310-340°
  if (h >= 310 && h < 340) {
    if (v > 60) return 'Rosa'
    return 'Roxo'
  }
  
  // ========== FALLBACK RGB ==========
  if (r > g + 50 && r > b + 50) {
    if (brightness < 80) return 'Bordô'
    return 'Vermelho'
  }
  
  if (g > r + 50 && g > b + 50) {
    return 'Verde'
  }
  
  if (b > r + 50 && b > g + 50) {
    return 'Azul'
  }
  
  // Cor mista
  if (r > 200 && g > 200 && b < 100) return 'Amarelo'
  if (r > 200 && g < 100 && b > 200) return 'Roxo'
  if (r < 100 && g > 200 && b > 200) return 'Azul Claro'
  
  // Último recurso
  if (brightness > 180) return 'Branco'
  if (brightness < 60) return 'Preto'
  return 'Cinza'
}
