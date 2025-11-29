import { CLOTHING_CATEGORIES, type ClothingCategory } from './clothing-categories'

export interface SearchCriteria {
  categories: ClothingCategory[]
  subcategories: string[]
  sizes: string[]
  colors: string[]
  rawText: string
}

// Mapeamento de termos comuns para categorias
const categoryKeywords: Record<string, ClothingCategory[]> = {
  'bodie': ['CLOTHES'],
  'bodies': ['CLOTHES'],
  'body': ['CLOTHES'],
  't-shirt': ['CLOTHES'],
  'tshirt': ['CLOTHES'],
  't shirt': ['CLOTHES'],
  'calça': ['CLOTHES'],
  'calças': ['CLOTHES'],
  'calção': ['CLOTHES'],
  'calções': ['CLOTHES'],
  'casaco': ['CLOTHES'],
  'casacos': ['CLOTHES'],
  'camisola': ['CLOTHES'],
  'camisolas': ['CLOTHES'],
  'pijama': ['CLOTHES'],
  'pijamas': ['CLOTHES'],
  'sapato': ['SHOES'],
  'sapatos': ['SHOES'],
  'ténis': ['SHOES'],
  'tenis': ['SHOES'],
  'sandália': ['SHOES'],
  'sandálias': ['SHOES'],
  'sandalia': ['SHOES'],
  'sandalias': ['SHOES'],
  'meia': ['ACCESSORIES'],
  'meias': ['ACCESSORIES'],
  'gorro': ['ACCESSORIES'],
  'gorros': ['ACCESSORIES'],
  'chapéu': ['ACCESSORIES'],
  'chapéus': ['ACCESSORIES'],
  'chapeu': ['ACCESSORIES'],
  'chapeus': ['ACCESSORIES'],
  'toalha': ['BATH_BED'],
  'toalhas': ['BATH_BED'],
  'lençol': ['BATH_BED'],
  'lençóis': ['BATH_BED'],
  'lencol': ['BATH_BED'],
  'lencois': ['BATH_BED'],
}

// Mapeamento de termos para subcategorias
const subcategoryKeywords: Record<string, string[]> = {
  'bodie': ['BODIES_SHORT', 'BODIES_LONG', 'BODIES_SLEEVELESS'],
  'bodies': ['BODIES_SHORT', 'BODIES_LONG', 'BODIES_SLEEVELESS'],
  'body': ['BODIES_SHORT', 'BODIES_LONG', 'BODIES_SLEEVELESS'],
  'bodie curto': ['BODIES_SHORT'],
  'bodie comprido': ['BODIES_LONG'],
  'bodie sem mangas': ['BODIES_SLEEVELESS'],
  't-shirt': ['TSHIRTS_SHORT', 'TSHIRTS_LONG', 'TSHIRTS_SLEEVELESS'],
  'tshirt': ['TSHIRTS_SHORT', 'TSHIRTS_LONG', 'TSHIRTS_SLEEVELESS'],
  't shirt': ['TSHIRTS_SHORT', 'TSHIRTS_LONG', 'TSHIRTS_SLEEVELESS'],
  'calça': ['PANTS_SPORTSWEAR', 'PANTS_LEGGINGS', 'PANTS_DENIM', 'PANTS_CHINO', 'PANTS_FABRIC'],
  'calças': ['PANTS_SPORTSWEAR', 'PANTS_LEGGINGS', 'PANTS_DENIM', 'PANTS_CHINO', 'PANTS_FABRIC'],
  'calção': ['SHORTS'],
  'calções': ['SHORTS'],
  'ténis': ['SNEAKERS'],
  'tenis': ['SNEAKERS'],
  'sandália': ['SANDALS'],
  'sandálias': ['SANDALS'],
  'sandalia': ['SANDALS'],
  'sandalias': ['SANDALS'],
  'meia': ['SOCKS'],
  'meias': ['SOCKS'],
  'gorro': ['HAT'],
  'gorros': ['HAT'],
  'chapéu': ['CAP'],
  'chapéus': ['CAP'],
  'chapeu': ['CAP'],
  'chapeus': ['CAP'],
  'toalha': ['TOWEL'],
  'toalhas': ['TOWEL'],
  'lençol': ['SHEETS'],
  'lençóis': ['SHEETS'],
  'lencol': ['SHEETS'],
  'lencois': ['SHEETS'],
}

// Cores comuns
const colorKeywords = [
  'azul', 'vermelho', 'verde', 'amarelo', 'branco', 'preto', 'rosa', 'roxo', 'laranja',
  'cinza', 'cinzento', 'bege', 'marrom', 'castanho', 'dourado', 'prateado', 'azul claro',
  'azul escuro', 'verde claro', 'verde escuro', 'rosa claro', 'rosa escuro', 'vermelho claro',
  'vermelho escuro', 'amarelo claro', 'amarelo escuro', 'laranja claro', 'laranja escuro',
  'roxo claro', 'roxo escuro', 'cinza claro', 'cinza escuro', 'branco', 'preto',
  'azul marinho', 'verde oliva', 'coral', 'salmon', 'turquesa', 'magenta', 'ciano',
  'lilás', 'lavanda', 'pêssego', 'creme', 'ivory', 'champagne', 'caramelo', 'chocolate',
  'caramelo', 'café', 'caramelo', 'caramelo', 'caramelo', 'caramelo', 'caramelo',
]

// Padrões de tamanho
const sizePatterns = [
  /(\d+)\s*a\s*(\d+)\s*meses?/i,
  /(\d+)\s*-\s*(\d+)\s*meses?/i,
  /(\d+)\s*a\s*(\d+)\s*m/i,
  /(\d+)\s*-\s*(\d+)\s*m/i,
  /recém\s*-?\s*nascido/i,
  /recem\s*-?\s*nascido/i,
  /(\d+)\s*anos?/i,
  /(\d+)\s*meses?/i,
  /tamanho\s*(\d+)/i,
  /t\.?\s*(\d+)/i,
  /(\d+)\s*cm/i,
]

export function parseSearchQuery(query: string, sizeOptions: Array<{ id: string; label: string }>): SearchCriteria {
  const lowerQuery = query.toLowerCase().trim()
  const criteria: SearchCriteria = {
    categories: [],
    subcategories: [],
    sizes: [],
    colors: [],
    rawText: query,
  }

  if (!lowerQuery) {
    return criteria
  }

  // Procurar categorias
  for (const [keyword, categories] of Object.entries(categoryKeywords)) {
    if (lowerQuery.includes(keyword)) {
      criteria.categories.push(...categories)
      break // Apenas a primeira categoria encontrada
    }
  }

  // Procurar subcategorias
  for (const [keyword, subcats] of Object.entries(subcategoryKeywords)) {
    if (lowerQuery.includes(keyword)) {
      criteria.subcategories.push(...subcats)
      break // Apenas as primeiras subcategorias encontradas
    }
  }

  // Procurar tamanhos nos sizeOptions
  for (const sizeOption of sizeOptions) {
    const sizeLabel = sizeOption.label.toLowerCase()
    if (lowerQuery.includes(sizeLabel)) {
      criteria.sizes.push(sizeOption.label)
    }
  }

  // Procurar padrões de tamanho
  for (const pattern of sizePatterns) {
    const match = lowerQuery.match(pattern)
    if (match) {
      const matchedText = match[0]
      // Procurar se algum sizeOption corresponde
      for (const sizeOption of sizeOptions) {
        const sizeLabel = sizeOption.label.toLowerCase()
        if (sizeLabel.includes(matchedText) || matchedText.includes(sizeLabel)) {
          if (!criteria.sizes.includes(sizeOption.label)) {
            criteria.sizes.push(sizeOption.label)
          }
        }
      }
      // Também adicionar o texto original como tamanho
      if (!criteria.sizes.some(s => s.toLowerCase().includes(matchedText))) {
        criteria.sizes.push(matchedText)
      }
    }
  }

  // Procurar cores
  for (const color of colorKeywords) {
    if (lowerQuery.includes(color)) {
      criteria.colors.push(color)
    }
  }

  return criteria
}

export function matchesSearchCriteria(item: any, criteria: SearchCriteria, sizeOptions: Array<{ id: string; label: string }>): boolean {
  // Se não há critérios, retorna true
  if (criteria.categories.length === 0 && 
      criteria.subcategories.length === 0 && 
      criteria.sizes.length === 0 && 
      criteria.colors.length === 0) {
    // Se há texto mas não foi identificado, fazer busca genérica
    if (criteria.rawText.trim()) {
      const lowerText = criteria.rawText.toLowerCase()
      const itemSubcategory = item.subcategory?.toLowerCase() || ''
      const itemSize = item.size?.toLowerCase() || ''
      const itemSizeLabel = item.sizeOption?.label?.toLowerCase() || ''
      let itemColors: string[] = []
      try {
        itemColors = JSON.parse(item.colors || '[]').map((c: string) => c?.toLowerCase() || '')
      } catch {
        itemColors = []
      }
      
      return itemSubcategory.includes(lowerText) ||
             itemSize.includes(lowerText) ||
             itemSizeLabel.includes(lowerText) ||
             itemColors.some((c: string) => c.includes(lowerText))
    }
    return true
  }

  // Verificar categoria
  if (criteria.categories.length > 0 && !criteria.categories.includes(item.category)) {
    return false
  }

  // Verificar subcategoria
  if (criteria.subcategories.length > 0 && !criteria.subcategories.includes(item.subcategory)) {
    return false
  }

  // Verificar tamanho
  if (criteria.sizes.length > 0) {
    const itemSize = item.size?.toLowerCase() || ''
    const itemSizeLabel = item.sizeOption?.label?.toLowerCase() || ''
    const matchesSize = criteria.sizes.some(size => {
      const lowerSize = size.toLowerCase()
      return itemSize.includes(lowerSize) || 
             itemSizeLabel.includes(lowerSize) ||
             lowerSize.includes(itemSize) ||
             lowerSize.includes(itemSizeLabel)
    })
    if (!matchesSize) {
      return false
    }
  }

  // Verificar cores
  if (criteria.colors.length > 0) {
    let itemColors: string[] = []
    try {
      itemColors = JSON.parse(item.colors || '[]').map((c: string) => c?.toLowerCase() || '')
    } catch {
      itemColors = []
    }
    
    const matchesColor = criteria.colors.some(color => {
      const lowerColor = color.toLowerCase()
      return itemColors.some((c: string) => c.includes(lowerColor) || lowerColor.includes(c))
    })
    if (!matchesColor) {
      return false
    }
  }

  return true
}

