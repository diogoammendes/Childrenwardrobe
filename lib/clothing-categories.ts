export const CLOTHING_CATEGORIES = {
  CLOTHES: {
    label: 'Roupa',
    subcategories: {
      BODIES_SHORT: 'Bodies (curto)',
      BODIES_LONG: 'Bodies (comprido)',
      BODIES_SLEEVELESS: 'Bodies (sem mangas)',
      TSHIRTS_SHORT: 'T-shirts (curto)',
      TSHIRTS_LONG: 'T-shirts (comprido)',
      TSHIRTS_SLEEVELESS: 'T-shirts (sem mangas)',
      SHORTS: 'Calções',
      PANTS_SPORTSWEAR: 'Calças (fato treino)',
      PANTS_LEGGINGS: 'Calças (leggings)',
      PANTS_DENIM: 'Calças (ganga)',
      PANTS_CHINO: 'Calças (sarja)',
      PANTS_FABRIC: 'Calças (tecido)',
      JACKETS_SPORTSWEAR: 'Casacos (fato de treino)',
      JACKETS_KNIT: 'Casacos (malha)',
      JACKETS_WINDBREAKER: 'Casacos (corta vento)',
      JACKETS_BOMBER: 'Casacos (bomber)',
      SKIRT: 'Saia',
      ONEPIECE_FUZZY: 'Peça única (fofo)',
      ONEPIECE_DRESS: 'Peça única (vestido)',
      OVERALLS_SKIRT: 'Macacão (saia)',
      OVERALLS_PANTS: 'Macacão (calça)',
      OVERALLS_SHORTS: 'Macacão (calção)',
      PAJAMAS_ONESIE_FEET: 'Pijama (onesie c/pés)',
      PAJAMAS_ONESIE_SHORT: 'Pijama (onesie curto)',
      PAJAMAS_ONESIE_NO_FEET: 'Pijama (onesie s/pés)',
      PAJAMAS_TWO_PIECE: 'Pijama (2 peças)',
      SWEATERS_KNIT: 'Camisolas (malha)',
      SWEATERS_HOODIE: 'Camisolas (sweat c/capuz)',
      SWEATERS_SWEATSHIRT: 'Camisolas (sweat sem capuz)',
      VEST: 'Colete',
    },
  },
  SHOES: {
    label: 'Sapatos',
    subcategories: {
      SNEAKERS: 'Ténis',
      SANDALS: 'Sandálias',
      FLIPFLOPS: 'Chinelos',
      BOOTS: 'Botas',
    },
  },
  ACCESSORIES: {
    label: 'Acessórios',
    subcategories: {
      SOCKS: 'Meias',
      TIGHTS: 'Collants',
      HAT: 'Gorro',
      CAP: 'Chapéu',
      SCARF: 'Cachecol',
      BOWS_HEADBANDS: 'Laços/bandoletes',
    },
  },
  BATH_BED: {
    label: 'Banho/Cama',
    subcategories: {
      TOWEL: 'Toalha',
      SHEETS: 'Lençóis',
      DUVET: 'Edredom',
      BLANKET: 'Manta',
      MATTRESS_PROTECTOR: 'Protetor de colchão',
    },
  },
} as const

export type ClothingCategory = keyof typeof CLOTHING_CATEGORIES

export function getSubcategories(category: ClothingCategory) {
  return CLOTHING_CATEGORIES[category]?.subcategories || {}
}

export function getCategoryLabel(category: ClothingCategory) {
  return CLOTHING_CATEGORIES[category]?.label || category
}

export function getSubcategoryLabel(category: ClothingCategory, subcategory: string) {
  return CLOTHING_CATEGORIES[category]?.subcategories[subcategory as keyof typeof CLOTHING_CATEGORIES[typeof category]['subcategories']] || subcategory
}

