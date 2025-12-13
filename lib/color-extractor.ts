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
 * Calcula a diferença entre duas cores RGB
 */
function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt(
    Math.pow(r1 - r2, 2) +
    Math.pow(g1 - g2, 2) +
    Math.pow(b1 - b2, 2)
  )
}

/**
 * Extrai a cor dominante de uma imagem usando análise avançada
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
        
        // Usar tamanho maior para melhor precisão (200x200)
        const maxSize = 200
        const ratio = Math.min(maxSize / img.width, maxSize / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const pixels = imageData.data
        
        // Coletar todos os pixels válidos
        const validPixels: Array<{ r: number; g: number; b: number }> = []
        
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i]
          const g = pixels[i + 1]
          const b = pixels[i + 2]
          const a = pixels[i + 3]
          
          // Ignorar apenas pixels completamente transparentes
          if (a < 50) continue
          
          validPixels.push({ r, g, b })
        }
        
        if (validPixels.length === 0) {
          resolve(null)
          return
        }
        
        // Calcular média RGB
        let sumR = 0, sumG = 0, sumB = 0
        for (const pixel of validPixels) {
          sumR += pixel.r
          sumG += pixel.g
          sumB += pixel.b
        }
        
        const avgR = Math.round(sumR / validPixels.length)
        const avgG = Math.round(sumG / validPixels.length)
        const avgB = Math.round(sumB / validPixels.length)
        
        // Usar análise RGB direta primeiro para cores neutras (mais preciso)
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
 * Converte RGB para nome de cor em português com análise multi-camadas
 */
function rgbToColorName(r: number, g: number, b: number): string {
  // Análise RGB direta para cores neutras (mais preciso que HSV)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min
  const brightness = (r + g + b) / 3
  
  // ===== CAMADA 1: Cores Neutras (Preto, Branco, Cinza) =====
  // Verificar se é uma cor neutra (diferença pequena entre componentes)
  if (diff <= 20) {
    // Branco: muito claro
    if (brightness >= 240) return 'Branco'
    // Preto: muito escuro
    if (brightness <= 30) return 'Preto'
    // Cinza: médio
    return 'Cinza'
  }
  
  // ===== CAMADA 2: Análise HSV para cores saturadas =====
  const hsv = rgbToHsv(r, g, b)
  const { h, s, v } = hsv
  
  // Cores muito escuras (preto com leve tom de cor)
  if (v < 20) return 'Preto'
  
  // Cores muito claras com baixa saturação (branco com leve tom)
  if (v > 90 && s < 15) return 'Branco'
  
  // Cores com baixa saturação mas não neutras (tons pastéis/terra)
  if (s < 25) {
    if (v > 75) return 'Bege'
    if (v < 35) return 'Castanho'
    // Cinza colorido
    return 'Cinza'
  }
  
  // ===== CAMADA 3: Cores Saturadas por Matiz (Hue) =====
  
  // Vermelho: 0-20° e 340-360°
  if ((h >= 0 && h < 20) || (h >= 340 && h <= 360)) {
    // Vermelho puro: alta saturação
    if (s > 60) {
      if (v > 30) return 'Vermelho'
      return 'Vermelho' // Vermelho escuro ainda é vermelho
    }
    // Vermelho com baixa saturação pode ser rosa ou castanho
    if (v > 60) return 'Rosa'
    if (v < 50) return 'Castanho'
    return 'Vermelho'
  }
  
  // Laranja: 20-40°
  if (h >= 20 && h < 40) {
    if (s > 50 && v > 40) return 'Laranja'
    if (v < 40) return 'Castanho'
    return 'Laranja'
  }
  
  // Amarelo: 40-70°
  if (h >= 40 && h < 70) {
    if (s > 40) return 'Amarelo'
    return 'Bege'
  }
  
  // Verde: 70-160°
  if (h >= 70 && h < 160) {
    if (v > 70 && s > 50) return 'Verde Claro'
    if (s > 40) return 'Verde'
    return 'Verde'
  }
  
  // Ciano/Azul claro: 160-200°
  if (h >= 160 && h < 200) {
    if (v > 70) return 'Azul Claro'
    return 'Azul'
  }
  
  // Azul: 200-260°
  if (h >= 200 && h < 260) {
    if (v > 70 && s > 50) return 'Azul Claro'
    return 'Azul'
  }
  
  // Roxo/Violeta: 260-320°
  if (h >= 260 && h < 320) {
    if (s > 40) return 'Roxo'
    if (v < 50) return 'Roxo'
    return 'Roxo'
  }
  
  // Rosa: 320-340°
  if (h >= 320 && h < 340) {
    if (s > 50 && v > 50) return 'Rosa'
    if (v > 70) return 'Rosa'
    return 'Roxo'
  }
  
  // ===== CAMADA 4: Fallback - Análise RGB por componente dominante =====
  
  // Determinar qual componente é dominante
  const rDominance = r - Math.max(g, b)
  const gDominance = g - Math.max(r, b)
  const bDominance = b - Math.max(r, g)
  
  // Vermelho dominante
  if (rDominance > 50) {
    if (g > 150 && b < 100) return 'Laranja'
    if (g > 120 && b < 80) return 'Amarelo'
    if (r > 180 && g < 80 && b < 80) return 'Vermelho'
    if (r > 120) return 'Vermelho'
    return 'Vermelho'
  }
  
  // Verde dominante
  if (gDominance > 50) {
    if (g > 180 && r < 100 && b < 100) return 'Verde'
    if (g > 120) return 'Verde'
    return 'Verde'
  }
  
  // Azul dominante
  if (bDominance > 50) {
    if (b > 180 && r < 100 && g < 100) return 'Azul'
    if (b > 120) return 'Azul'
    return 'Azul'
  }
  
  // Cores equilibradas mas não neutras
  if (diff < 50) {
    if (brightness > 200) return 'Branco'
    if (brightness < 60) return 'Preto'
    return 'Cinza'
  }
  
  // Último recurso: cor baseada no componente mais alto
  if (r >= g && r >= b) {
    if (r > 200) return 'Vermelho'
    return 'Vermelho'
  } else if (g >= r && g >= b) {
    return 'Verde'
  } else {
    return 'Azul'
  }
}
