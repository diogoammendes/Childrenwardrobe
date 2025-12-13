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
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          resolve(null)
          return
        }
        
        const maxSize = 150
        const ratio = Math.min(maxSize / img.width, maxSize / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const pixels = imageData.data
        
        // Coletar pixels válidos
        const validPixels: Array<{ r: number; g: number; b: number }> = []
        
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i]
          const g = pixels[i + 1]
          const b = pixels[i + 2]
          const a = pixels[i + 3]
          
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
 * Prioridade: Cores neutras primeiro, depois cores saturadas
 */
function rgbToColorName(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min
  const brightness = (r + g + b) / 3
  
  // ========== PRIORIDADE 1: CORES NEUTRAS (RGB direto) ==========
  // Branco: todos os componentes muito altos e próximos
  if (r >= 230 && g >= 230 && b >= 230 && diff <= 30) {
    return 'Branco'
  }
  
  // Preto: todos os componentes muito baixos e próximos
  if (r <= 50 && g <= 50 && b <= 50 && diff <= 30) {
    return 'Preto'
  }
  
  // Cinza: componentes equilibrados, brilho médio
  if (diff <= 30 && brightness >= 60 && brightness <= 200) {
    return 'Cinza'
  }
  
  // ========== PRIORIDADE 2: Análise HSV ==========
  const hsv = rgbToHsv(r, g, b)
  const { h, s, v } = hsv
  
  // Preto (mesmo com leve tom): brilho muito baixo
  if (v < 25) {
    return 'Preto'
  }
  
  // Branco (mesmo com leve tom): brilho muito alto e baixa saturação
  if (v > 85 && s < 20) {
    return 'Branco'
  }
  
  // Cinza: baixa saturação e brilho médio
  if (s < 20 && v >= 25 && v <= 85) {
    return 'Cinza'
  }
  
  // ========== PRIORIDADE 3: Cores com baixa saturação (tons pastéis/terra) ==========
  if (s < 30) {
    if (v > 70) return 'Bege'
    if (v < 40) return 'Castanho'
    return 'Cinza'
  }
  
  // ========== PRIORIDADE 4: Cores saturadas por matiz ==========
  
  // Vermelho: 0-25° e 335-360°
  if ((h >= 0 && h < 25) || (h >= 335 && h <= 360)) {
    // Bordô: vermelho muito escuro
    if (v < 35 && s > 40) return 'Bordô'
    // Vermelho escuro mas não bordô
    if (v < 50 && s > 50) return 'Vermelho'
    // Vermelho normal
    if (s > 50) return 'Vermelho'
    // Vermelho com baixa saturação pode ser rosa
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
  
  // ========== PRIORIDADE 5: Fallback RGB (apenas se não foi identificado) ==========
  // Se chegou aqui, usar análise RGB simples
  const rDominance = r - Math.max(g, b)
  const gDominance = g - Math.max(r, b)
  const bDominance = b - Math.max(r, g)
  
  // Vermelho dominante (mas verificar se não é muito escuro = bordô)
  if (rDominance > 40) {
    if (brightness < 60) return 'Bordô'
    if (g > 140 && b < 100) return 'Laranja'
    if (g > 110 && b < 80) return 'Amarelo'
    return 'Vermelho'
  }
  
  // Verde dominante
  if (gDominance > 40) {
    return 'Verde'
  }
  
  // Azul dominante
  if (bDominance > 40) {
    return 'Azul'
  }
  
  // Se nenhum componente é claramente dominante, é uma cor neutra
  if (diff < 40) {
    if (brightness > 200) return 'Branco'
    if (brightness < 60) return 'Preto'
    return 'Cinza'
  }
  
  // Último recurso: componente mais alto (mas com verificações)
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
