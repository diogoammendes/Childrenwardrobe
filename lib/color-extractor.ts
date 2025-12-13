/**
 * Sistema de detecção de cor dominante em imagens
 * Usa quantização de cores e matching com paleta LAB
 */

// ============== TIPOS ==============

interface RGB {
  r: number
  g: number
  b: number
}

interface LAB {
  l: number
  a: number
  b: number
}

interface NamedColor {
  name: string
  rgb: RGB
  lab: LAB
}

// ============== PALETA DE CORES ==============

const COLOR_PALETTE: Array<{ name: string; rgb: RGB }> = [
  // Neutras
  { name: 'Branco', rgb: { r: 255, g: 255, b: 255 } },
  { name: 'Preto', rgb: { r: 0, g: 0, b: 0 } },
  { name: 'Cinza Claro', rgb: { r: 200, g: 200, b: 200 } },
  { name: 'Cinza', rgb: { r: 128, g: 128, b: 128 } },
  { name: 'Cinza Escuro', rgb: { r: 64, g: 64, b: 64 } },
  
  // Vermelhos
  { name: 'Vermelho', rgb: { r: 220, g: 30, b: 30 } },
  { name: 'Vermelho Escuro', rgb: { r: 139, g: 0, b: 0 } },
  { name: 'Bordô', rgb: { r: 128, g: 0, b: 32 } },
  
  // Rosas
  { name: 'Rosa', rgb: { r: 255, g: 105, b: 180 } },
  { name: 'Rosa Claro', rgb: { r: 255, g: 182, b: 193 } },
  
  // Laranjas
  { name: 'Laranja', rgb: { r: 255, g: 140, b: 0 } },
  { name: 'Coral', rgb: { r: 255, g: 127, b: 80 } },
  
  // Amarelos
  { name: 'Amarelo', rgb: { r: 255, g: 220, b: 0 } },
  { name: 'Dourado', rgb: { r: 218, g: 165, b: 32 } },
  
  // Beges/Castanhos
  { name: 'Bege', rgb: { r: 245, g: 222, b: 179 } },
  { name: 'Creme', rgb: { r: 255, g: 253, b: 208 } },
  { name: 'Castanho', rgb: { r: 150, g: 100, b: 60 } },
  { name: 'Castanho Escuro', rgb: { r: 92, g: 64, b: 51 } },
  
  // Verdes
  { name: 'Verde', rgb: { r: 34, g: 139, b: 34 } },
  { name: 'Verde Claro', rgb: { r: 144, g: 238, b: 144 } },
  { name: 'Verde Escuro', rgb: { r: 0, g: 100, b: 0 } },
  { name: 'Verde Oliva', rgb: { r: 128, g: 128, b: 0 } },
  
  // Azuis
  { name: 'Azul', rgb: { r: 30, g: 80, b: 200 } },
  { name: 'Azul Claro', rgb: { r: 135, g: 206, b: 235 } },
  { name: 'Azul Escuro', rgb: { r: 0, g: 0, b: 139 } },
  { name: 'Azul Marinho', rgb: { r: 0, g: 0, b: 80 } },
  { name: 'Turquesa', rgb: { r: 64, g: 224, b: 208 } },
  
  // Roxos
  { name: 'Roxo', rgb: { r: 128, g: 0, b: 128 } },
  { name: 'Violeta', rgb: { r: 148, g: 0, b: 211 } },
  { name: 'Lilás', rgb: { r: 200, g: 162, b: 200 } },
]

// ============== CONVERSÕES DE COR ==============

/**
 * Converte RGB para LAB (espaço perceptualmente uniforme)
 */
function rgbToLab(rgb: RGB): LAB {
  // RGB para XYZ
  let r = rgb.r / 255
  let g = rgb.g / 255
  let b = rgb.b / 255

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92

  r *= 100
  g *= 100
  b *= 100

  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750
  const z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041

  // XYZ para LAB (D65)
  const refX = 95.047
  const refY = 100.000
  const refZ = 108.883

  let xr = x / refX
  let yr = y / refY
  let zr = z / refZ

  const epsilon = 0.008856
  const kappa = 903.3

  xr = xr > epsilon ? Math.pow(xr, 1/3) : (kappa * xr + 16) / 116
  yr = yr > epsilon ? Math.pow(yr, 1/3) : (kappa * yr + 16) / 116
  zr = zr > epsilon ? Math.pow(zr, 1/3) : (kappa * zr + 16) / 116

  return {
    l: 116 * yr - 16,
    a: 500 * (xr - yr),
    b: 200 * (yr - zr)
  }
}

/**
 * Calcula distância Delta E entre duas cores LAB
 */
function deltaE(lab1: LAB, lab2: LAB): number {
  return Math.sqrt(
    Math.pow(lab1.l - lab2.l, 2) +
    Math.pow(lab1.a - lab2.a, 2) +
    Math.pow(lab1.b - lab2.b, 2)
  )
}

// Pre-calcular LAB para paleta
const PALETTE_WITH_LAB: NamedColor[] = COLOR_PALETTE.map(c => ({
  name: c.name,
  rgb: c.rgb,
  lab: rgbToLab(c.rgb)
}))

// ============== QUANTIZAÇÃO DE CORES ==============

/**
 * Quantiza cor para bucket (determinístico, sem aleatoriedade)
 */
function quantizeColor(r: number, g: number, b: number, levels: number): string {
  const step = 256 / levels
  const qr = Math.floor(r / step)
  const qg = Math.floor(g / step)
  const qb = Math.floor(b / step)
  return `${qr},${qg},${qb}`
}

/**
 * Verifica se é provavelmente cor de fundo
 */
function isLikelyBackground(r: number, g: number, b: number): boolean {
  const brightness = (r + g + b) / 3
  const diff = Math.max(r, g, b) - Math.min(r, g, b)
  
  // Branco ou quase branco (fundo típico)
  if (brightness > 235 && diff < 30) return true
  
  // Cinza muito claro
  if (brightness > 220 && diff < 20) return true
  
  return false
}

/**
 * Encontra o nome da cor mais próxima na paleta
 */
function findClosestColorName(rgb: RGB): string {
  const lab = rgbToLab(rgb)
  let minDist = Infinity
  let closestName = 'Desconhecido'
  
  for (const color of PALETTE_WITH_LAB) {
    const dist = deltaE(lab, color.lab)
    if (dist < minDist) {
      minDist = dist
      closestName = color.name
    }
  }
  
  return closestName
}

// ============== EXTRAÇÃO DE COR ==============

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
        
        // Redimensionar
        const maxSize = 100
        const ratio = Math.min(maxSize / img.width, maxSize / img.height)
        canvas.width = Math.max(1, Math.floor(img.width * ratio))
        canvas.height = Math.max(1, Math.floor(img.height * ratio))
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const pixels = imageData.data
        const width = canvas.width
        const height = canvas.height
        
        // Quantizar e contar cores (usar centro 60% da imagem)
        const marginX = Math.floor(width * 0.2)
        const marginY = Math.floor(height * 0.2)
        
        const colorCounts = new Map<string, { r: number; g: number; b: number; count: number }>()
        let totalPixels = 0
        
        for (let y = marginY; y < height - marginY; y++) {
          for (let x = marginX; x < width - marginX; x++) {
            const idx = (y * width + x) * 4
            const r = pixels[idx]
            const g = pixels[idx + 1]
            const b = pixels[idx + 2]
            const a = pixels[idx + 3]
            
            if (a < 128) continue
            
            totalPixels++
            
            // Quantizar para 8 níveis (32 tons por canal)
            const key = quantizeColor(r, g, b, 8)
            
            if (colorCounts.has(key)) {
              const entry = colorCounts.get(key)!
              entry.r += r
              entry.g += g
              entry.b += b
              entry.count++
            } else {
              colorCounts.set(key, { r, g, b, count: 1 })
            }
          }
        }
        
        // Fallback: usar todos os pixels
        if (totalPixels < 50) {
          colorCounts.clear()
          totalPixels = 0
          
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i]
            const g = pixels[i + 1]
            const b = pixels[i + 2]
            const a = pixels[i + 3]
            
            if (a < 128) continue
            
            totalPixels++
            const key = quantizeColor(r, g, b, 8)
            
            if (colorCounts.has(key)) {
              const entry = colorCounts.get(key)!
              entry.r += r
              entry.g += g
              entry.b += b
              entry.count++
            } else {
              colorCounts.set(key, { r, g, b, count: 1 })
            }
          }
        }
        
        if (colorCounts.size === 0) {
          resolve(null)
          return
        }
        
        // Converter para array e ordenar por frequência
        const sortedColors = Array.from(colorCounts.values())
          .map(entry => ({
            r: Math.round(entry.r / entry.count),
            g: Math.round(entry.g / entry.count),
            b: Math.round(entry.b / entry.count),
            count: entry.count
          }))
          .sort((a, b) => b.count - a.count)
        
        // Encontrar a cor dominante (não-fundo)
        let dominantColor: { r: number; g: number; b: number } | null = null
        
        for (const color of sortedColors) {
          // Se este cluster tem pelo menos 5% dos pixels e não é fundo
          const percentage = color.count / totalPixels
          
          if (percentage >= 0.05 && !isLikelyBackground(color.r, color.g, color.b)) {
            dominantColor = color
            break
          }
        }
        
        // Se não encontrou, usar a mais frequente mesmo que pareça fundo
        if (!dominantColor && sortedColors.length > 0) {
          // Tentar encontrar qualquer cor que não seja fundo
          for (const color of sortedColors) {
            if (!isLikelyBackground(color.r, color.g, color.b)) {
              dominantColor = color
              break
            }
          }
          
          // Se tudo parece fundo, usar a mais frequente
          if (!dominantColor) {
            dominantColor = sortedColors[0]
          }
        }
        
        if (!dominantColor) {
          resolve(null)
          return
        }
        
        // Encontrar nome da cor na paleta usando LAB
        const colorName = findClosestColorName({
          r: dominantColor.r,
          g: dominantColor.g,
          b: dominantColor.b
        })
        
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
