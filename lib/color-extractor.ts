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

// ============== PALETA DE CORES EXPANDIDA ==============
// Paleta otimizada para roupa de criança com mais tonalidades

const COLOR_PALETTE: Array<{ name: string; rgb: RGB }> = [
  // ===== BRANCOS E TONS CLAROS =====
  { name: 'Branco', rgb: { r: 255, g: 255, b: 255 } },
  { name: 'Branco', rgb: { r: 250, g: 250, b: 250 } },
  { name: 'Branco', rgb: { r: 245, g: 245, b: 245 } },
  { name: 'Branco', rgb: { r: 240, g: 240, b: 240 } },
  { name: 'Branco', rgb: { r: 235, g: 235, b: 235 } },
  { name: 'Branco', rgb: { r: 252, g: 250, b: 245 } }, // Off-white quente
  { name: 'Branco', rgb: { r: 248, g: 248, b: 255 } }, // Off-white frio
  
  // ===== PRETOS =====
  { name: 'Preto', rgb: { r: 0, g: 0, b: 0 } },
  { name: 'Preto', rgb: { r: 20, g: 20, b: 20 } },
  { name: 'Preto', rgb: { r: 30, g: 30, b: 30 } },
  { name: 'Preto', rgb: { r: 40, g: 40, b: 40 } },
  
  // ===== CINZAS =====
  { name: 'Cinza Escuro', rgb: { r: 55, g: 55, b: 55 } },
  { name: 'Cinza Escuro', rgb: { r: 70, g: 70, b: 70 } },
  { name: 'Cinza', rgb: { r: 100, g: 100, b: 100 } },
  { name: 'Cinza', rgb: { r: 128, g: 128, b: 128 } },
  { name: 'Cinza', rgb: { r: 150, g: 150, b: 150 } },
  { name: 'Cinza Claro', rgb: { r: 180, g: 180, b: 180 } },
  { name: 'Cinza Claro', rgb: { r: 200, g: 200, b: 200 } },
  { name: 'Cinza Claro', rgb: { r: 220, g: 220, b: 220 } },
  
  // ===== ROSAS - EXPANDIDO =====
  { name: 'Rosa', rgb: { r: 255, g: 105, b: 180 } }, // Hot pink
  { name: 'Rosa', rgb: { r: 255, g: 130, b: 171 } },
  { name: 'Rosa', rgb: { r: 255, g: 110, b: 150 } },
  { name: 'Rosa', rgb: { r: 255, g: 20, b: 147 } }, // Deep pink
  { name: 'Rosa Claro', rgb: { r: 255, g: 182, b: 193 } },
  { name: 'Rosa Claro', rgb: { r: 255, g: 192, b: 203 } },
  { name: 'Rosa Claro', rgb: { r: 255, g: 200, b: 210 } },
  { name: 'Rosa Claro', rgb: { r: 255, g: 218, b: 233 } },
  { name: 'Rosa Claro', rgb: { r: 252, g: 230, b: 235 } },
  { name: 'Rosa Bebé', rgb: { r: 244, g: 194, b: 194 } },
  { name: 'Rosa Bebé', rgb: { r: 255, g: 209, b: 220 } },
  { name: 'Rosa Salmão', rgb: { r: 255, g: 160, b: 160 } },
  { name: 'Rosa Velho', rgb: { r: 199, g: 144, b: 148 } },
  { name: 'Rosa Velho', rgb: { r: 188, g: 143, b: 143 } },
  { name: 'Fúcsia', rgb: { r: 255, g: 0, b: 127 } },
  { name: 'Fúcsia', rgb: { r: 218, g: 24, b: 132 } },
  
  // ===== VERMELHOS =====
  { name: 'Vermelho', rgb: { r: 255, g: 0, b: 0 } },
  { name: 'Vermelho', rgb: { r: 220, g: 30, b: 30 } },
  { name: 'Vermelho', rgb: { r: 200, g: 40, b: 40 } },
  { name: 'Vermelho Escuro', rgb: { r: 139, g: 0, b: 0 } },
  { name: 'Vermelho Escuro', rgb: { r: 160, g: 30, b: 30 } },
  { name: 'Bordô', rgb: { r: 128, g: 0, b: 32 } },
  { name: 'Bordô', rgb: { r: 144, g: 12, b: 63 } },
  { name: 'Vinho', rgb: { r: 114, g: 47, b: 55 } },
  { name: 'Coral', rgb: { r: 255, g: 127, b: 80 } },
  { name: 'Coral', rgb: { r: 240, g: 128, b: 128 } },
  
  // ===== LARANJAS =====
  { name: 'Laranja', rgb: { r: 255, g: 140, b: 0 } },
  { name: 'Laranja', rgb: { r: 255, g: 165, b: 0 } },
  { name: 'Laranja', rgb: { r: 255, g: 120, b: 50 } },
  { name: 'Pêssego', rgb: { r: 255, g: 218, b: 185 } },
  { name: 'Pêssego', rgb: { r: 255, g: 200, b: 170 } },
  
  // ===== AMARELOS =====
  { name: 'Amarelo', rgb: { r: 255, g: 255, b: 0 } },
  { name: 'Amarelo', rgb: { r: 255, g: 220, b: 0 } },
  { name: 'Amarelo', rgb: { r: 255, g: 235, b: 59 } },
  { name: 'Amarelo Claro', rgb: { r: 255, g: 255, b: 150 } },
  { name: 'Amarelo Claro', rgb: { r: 255, g: 255, b: 200 } },
  { name: 'Dourado', rgb: { r: 218, g: 165, b: 32 } },
  { name: 'Dourado', rgb: { r: 255, g: 193, b: 37 } },
  { name: 'Mostarda', rgb: { r: 205, g: 170, b: 25 } },
  
  // ===== BEGES E CASTANHOS =====
  { name: 'Bege', rgb: { r: 245, g: 222, b: 179 } },
  { name: 'Bege', rgb: { r: 235, g: 212, b: 169 } },
  { name: 'Bege', rgb: { r: 225, g: 200, b: 160 } },
  { name: 'Bege', rgb: { r: 215, g: 195, b: 165 } },
  { name: 'Creme', rgb: { r: 255, g: 253, b: 208 } },
  { name: 'Creme', rgb: { r: 255, g: 248, b: 220 } },
  { name: 'Creme', rgb: { r: 250, g: 240, b: 210 } },
  { name: 'Camel', rgb: { r: 193, g: 154, b: 107 } },
  { name: 'Camel', rgb: { r: 210, g: 170, b: 120 } },
  { name: 'Castanho Claro', rgb: { r: 181, g: 136, b: 99 } },
  { name: 'Castanho Claro', rgb: { r: 195, g: 155, b: 110 } },
  { name: 'Castanho', rgb: { r: 150, g: 100, b: 60 } },
  { name: 'Castanho', rgb: { r: 139, g: 90, b: 43 } },
  { name: 'Castanho', rgb: { r: 160, g: 110, b: 70 } },
  { name: 'Castanho Escuro', rgb: { r: 92, g: 64, b: 51 } },
  { name: 'Castanho Escuro', rgb: { r: 101, g: 67, b: 33 } },
  { name: 'Chocolate', rgb: { r: 123, g: 63, b: 0 } },
  { name: 'Terracota', rgb: { r: 204, g: 119, b: 77 } },
  
  // ===== VERDES =====
  { name: 'Verde', rgb: { r: 34, g: 139, b: 34 } },
  { name: 'Verde', rgb: { r: 50, g: 150, b: 50 } },
  { name: 'Verde', rgb: { r: 60, g: 179, b: 60 } },
  { name: 'Verde Claro', rgb: { r: 144, g: 238, b: 144 } },
  { name: 'Verde Claro', rgb: { r: 152, g: 251, b: 152 } },
  { name: 'Verde Menta', rgb: { r: 152, g: 255, b: 200 } },
  { name: 'Verde Menta', rgb: { r: 170, g: 230, b: 200 } },
  { name: 'Verde Água', rgb: { r: 127, g: 255, b: 212 } },
  { name: 'Verde Escuro', rgb: { r: 0, g: 100, b: 0 } },
  { name: 'Verde Escuro', rgb: { r: 25, g: 80, b: 25 } },
  { name: 'Verde Oliva', rgb: { r: 128, g: 128, b: 0 } },
  { name: 'Verde Oliva', rgb: { r: 107, g: 142, b: 35 } },
  { name: 'Verde Tropa', rgb: { r: 75, g: 83, b: 32 } },
  { name: 'Caqui', rgb: { r: 189, g: 183, b: 107 } },
  
  // ===== AZUIS =====
  { name: 'Azul', rgb: { r: 30, g: 80, b: 200 } },
  { name: 'Azul', rgb: { r: 65, g: 105, b: 225 } },
  { name: 'Azul', rgb: { r: 30, g: 144, b: 255 } },
  { name: 'Azul Claro', rgb: { r: 135, g: 206, b: 235 } },
  { name: 'Azul Claro', rgb: { r: 173, g: 216, b: 230 } },
  { name: 'Azul Claro', rgb: { r: 176, g: 224, b: 230 } },
  { name: 'Azul Bebé', rgb: { r: 137, g: 207, b: 240 } },
  { name: 'Azul Bebé', rgb: { r: 162, g: 220, b: 245 } },
  { name: 'Azul Celeste', rgb: { r: 100, g: 149, b: 237 } },
  { name: 'Azul Escuro', rgb: { r: 0, g: 0, b: 139 } },
  { name: 'Azul Escuro', rgb: { r: 25, g: 25, b: 112 } },
  { name: 'Azul Marinho', rgb: { r: 0, g: 0, b: 80 } },
  { name: 'Azul Marinho', rgb: { r: 0, g: 0, b: 60 } },
  { name: 'Azul Marinho', rgb: { r: 10, g: 30, b: 70 } },
  { name: 'Turquesa', rgb: { r: 64, g: 224, b: 208 } },
  { name: 'Turquesa', rgb: { r: 0, g: 206, b: 209 } },
  { name: 'Ciano', rgb: { r: 0, g: 255, b: 255 } },
  { name: 'Azul Petróleo', rgb: { r: 0, g: 128, b: 128 } },
  { name: 'Azul Ganga', rgb: { r: 67, g: 107, b: 149 } },
  { name: 'Azul Ganga', rgb: { r: 80, g: 115, b: 145 } },
  
  // ===== ROXOS E LILASES =====
  { name: 'Roxo', rgb: { r: 128, g: 0, b: 128 } },
  { name: 'Roxo', rgb: { r: 102, g: 51, b: 153 } },
  { name: 'Violeta', rgb: { r: 148, g: 0, b: 211 } },
  { name: 'Violeta', rgb: { r: 138, g: 43, b: 226 } },
  { name: 'Lilás', rgb: { r: 200, g: 162, b: 200 } },
  { name: 'Lilás', rgb: { r: 216, g: 191, b: 216 } },
  { name: 'Lilás Claro', rgb: { r: 230, g: 215, b: 230 } },
  { name: 'Lavanda', rgb: { r: 230, g: 230, b: 250 } },
  { name: 'Lavanda', rgb: { r: 181, g: 126, b: 220 } },
  { name: 'Magenta', rgb: { r: 255, g: 0, b: 255 } },
  { name: 'Malva', rgb: { r: 153, g: 102, b: 204 } },
  
  // ===== MULTICOLOR (fallback) =====
  { name: 'Multicolor', rgb: { r: 255, g: 128, b: 0 } }, // Placeholder
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
 * Verifica se é provavelmente cor de fundo (muito claro/branco)
 * Mais conservador para não classificar branco como cinza
 */
function isLikelyBackground(r: number, g: number, b: number): boolean {
  const brightness = (r + g + b) / 3
  const diff = Math.max(r, g, b) - Math.min(r, g, b)
  
  // Só considerar fundo se for MUITO branco (quase puro)
  // e com muito pouca variação entre canais
  if (brightness > 245 && diff < 15) return true
  
  return false
}

/**
 * Encontra o nome da cor mais próxima na paleta
 * Com lógica especial para cores problemáticas
 */
function findClosestColorName(rgb: RGB): string {
  const { r, g, b } = rgb
  const lab = rgbToLab(rgb)
  
  // === LÓGICA ESPECIAL PARA CORES EXTREMAS ===
  
  const brightness = (r + g + b) / 3
  const maxChannel = Math.max(r, g, b)
  const minChannel = Math.min(r, g, b)
  const saturation = maxChannel > 0 ? (maxChannel - minChannel) / maxChannel : 0
  const diff = maxChannel - minChannel
  
  // Branco puro ou quase branco (alta luminosidade, baixa saturação)
  if (brightness > 220 && diff < 35) {
    return 'Branco'
  }
  
  // Preto puro ou quase preto
  if (brightness < 35 && diff < 25) {
    return 'Preto'
  }
  
  // Cinza (baixa saturação, luminosidade média)
  if (saturation < 0.15 && brightness >= 35 && brightness <= 220) {
    if (brightness < 80) return 'Cinza Escuro'
    if (brightness < 150) return 'Cinza'
    return 'Cinza Claro'
  }
  
  // === MATCHING COM PALETA LAB ===
  
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
        
        // Redimensionar para tamanho fixo para análise consistente
        const maxSize = 150
        const ratio = Math.min(maxSize / img.width, maxSize / img.height)
        canvas.width = Math.max(1, Math.floor(img.width * ratio))
        canvas.height = Math.max(1, Math.floor(img.height * ratio))
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const pixels = imageData.data
        const width = canvas.width
        const height = canvas.height
        
        // Quantizar e contar cores (usar centro 50% da imagem para evitar fundos)
        const marginX = Math.floor(width * 0.25)
        const marginY = Math.floor(height * 0.25)
        
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
            
            // Quantizar para 16 níveis (mais granular)
            const key = quantizeColor(r, g, b, 16)
            
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
        if (totalPixels < 100) {
          colorCounts.clear()
          totalPixels = 0
          
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i]
            const g = pixels[i + 1]
            const b = pixels[i + 2]
            const a = pixels[i + 3]
            
            if (a < 128) continue
            
            totalPixels++
            const key = quantizeColor(r, g, b, 16)
            
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
          // Se este cluster tem pelo menos 3% dos pixels e não é fundo
          const percentage = color.count / totalPixels
          
          if (percentage >= 0.03 && !isLikelyBackground(color.r, color.g, color.b)) {
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
          
          // Se tudo parece fundo, usar a mais frequente (provavelmente é branco/creme)
          if (!dominantColor) {
            dominantColor = sortedColors[0]
          }
        }
        
        if (!dominantColor) {
          resolve(null)
          return
        }
        
        // Encontrar nome da cor na paleta usando LAB + lógica especial
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
