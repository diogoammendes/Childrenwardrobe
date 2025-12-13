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
        
        // Redimensionar imagem para análise mais rápida (máx 100x100)
        const maxSize = 100
        const ratio = Math.min(maxSize / img.width, maxSize / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        
        // Desenhar imagem no canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Obter dados de pixel
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const pixels = imageData.data
        
        // Calcular cor média (ignorando pixels muito claros/escuros que são geralmente fundo)
        let r = 0, g = 0, b = 0, count = 0
        
        for (let i = 0; i < pixels.length; i += 4) {
          const pixelR = pixels[i]
          const pixelG = pixels[i + 1]
          const pixelB = pixels[i + 2]
          const pixelA = pixels[i + 3]
          
          // Ignorar pixels transparentes
          if (pixelA < 128) continue
          
          // Ignorar pixels muito claros (branco/fundo) ou muito escuros (sombra)
          const brightness = (pixelR + pixelG + pixelB) / 3
          if (brightness < 30 || brightness > 240) continue
          
          r += pixelR
          g += pixelG
          b += pixelB
          count++
        }
        
        if (count === 0) {
          resolve(null)
          return
        }
        
        // Calcular média
        const avgR = Math.round(r / count)
        const avgG = Math.round(g / count)
        const avgB = Math.round(b / count)
        
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
 * Converte RGB para nome de cor em português
 */
function rgbToColorName(r: number, g: number, b: number): string {
  // Mapeamento de cores comuns
  const colors: Array<{ name: string; rgb: [number, number, number]; threshold: number }> = [
    { name: 'Branco', rgb: [255, 255, 255], threshold: 30 },
    { name: 'Preto', rgb: [0, 0, 0], threshold: 30 },
    { name: 'Cinza', rgb: [128, 128, 128], threshold: 40 },
    { name: 'Vermelho', rgb: [255, 0, 0], threshold: 60 },
    { name: 'Rosa', rgb: [255, 192, 203], threshold: 50 },
    { name: 'Laranja', rgb: [255, 165, 0], threshold: 50 },
    { name: 'Amarelo', rgb: [255, 255, 0], threshold: 60 },
    { name: 'Verde', rgb: [0, 128, 0], threshold: 60 },
    { name: 'Azul', rgb: [0, 0, 255], threshold: 60 },
    { name: 'Roxo', rgb: [128, 0, 128], threshold: 50 },
    { name: 'Rosa', rgb: [255, 20, 147], threshold: 50 },
    { name: 'Bege', rgb: [245, 245, 220], threshold: 40 },
    { name: 'Castanho', rgb: [139, 69, 19], threshold: 50 },
    { name: 'Azul Claro', rgb: [173, 216, 230], threshold: 50 },
    { name: 'Verde Claro', rgb: [144, 238, 144], threshold: 50 },
  ]
  
  // Encontrar cor mais próxima
  let closestColor = colors[0]
  let minDistance = Infinity
  
  for (const color of colors) {
    const distance = Math.sqrt(
      Math.pow(r - color.rgb[0], 2) +
      Math.pow(g - color.rgb[1], 2) +
      Math.pow(b - color.rgb[2], 2)
    )
    
    if (distance < minDistance) {
      minDistance = distance
      closestColor = color
    }
  }
  
  // Se a distância for muito grande, usar descrição genérica
  if (minDistance > closestColor.threshold) {
    // Determinar cor baseada em qual componente RGB é dominante
    if (r > g && r > b) {
      if (r > 200 && g > 150) return 'Laranja'
      if (g > 150) return 'Amarelo'
      return 'Vermelho'
    } else if (g > r && g > b) {
      return 'Verde'
    } else if (b > r && b > g) {
      return 'Azul'
    } else if (r === g && g === b) {
      if (r > 200) return 'Branco'
      if (r < 50) return 'Preto'
      return 'Cinza'
    }
  }
  
  return closestColor.name
}

