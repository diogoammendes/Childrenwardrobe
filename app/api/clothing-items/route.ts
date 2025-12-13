import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { hasRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { hasChildAccess } from '@/lib/child-access'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      category,
      subcategory,
      size,
      sizeOptionId,
      colors,
      photo,
      status,
      disposition,
      isSet,
      setItemId,
      childId,
      needsClassification, // Permite definir explicitamente se precisa classificação
    } = body

    // Apenas categoria e childId são obrigatórios
    if (!category || !childId) {
      return NextResponse.json(
        { error: 'Categoria e criança são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o utilizador tem acesso a esta criança
    if (!hasRole(session, 'ADMIN')) {
      const hasAccess = await hasChildAccess(session.user.id, childId)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Não autorizado' },
          { status: 403 }
        )
      }
    }

    // Normalizar setItemId: string vazia ou null vira null
    const normalizedSetItemId = setItemId && setItemId.trim() !== '' ? setItemId : null

    // Se setItemId foi fornecido, validar que o item existe
    if (normalizedSetItemId !== null) {
      const setItem = await prisma.clothingItem.findUnique({
        where: { id: normalizedSetItemId },
      })
      
      if (!setItem) {
        return NextResponse.json(
          { error: 'Item do conjunto não encontrado' },
          { status: 400 }
        )
      }
    }

    // Determinar se precisa classificação
    // Precisa classificação se: subcategory, colors ou size não estiverem preenchidos
    const hasSubcategory = subcategory && subcategory.trim() !== ''
    const hasColors = colors && Array.isArray(colors) && colors.length > 0
    const hasSize = (sizeOptionId && sizeOptionId.trim() !== '') || (size && size.trim() !== '')
    
    const itemNeedsClassification = needsClassification !== undefined 
      ? needsClassification 
      : !hasSubcategory || !hasColors || !hasSize

    let finalSize: string | null = null
    let finalSizeOptionId: string | null = null

    if (sizeOptionId && sizeOptionId.trim() !== '') {
      const option = await prisma.sizeOption.findUnique({
        where: { id: sizeOptionId },
      })

      if (!option) {
        return NextResponse.json(
          { error: 'Tamanho selecionado não é válido' },
          { status: 400 }
        )
      }

      finalSize = option.label
      finalSizeOptionId = option.id
    } else if (size && size.trim() !== '') {
      finalSize = size.trim()
    }

    // Normalizar cores: se for array, converter para JSON; se for string vazia, null
    let finalColors: string | null = null
    if (colors) {
      if (Array.isArray(colors) && colors.length > 0) {
        finalColors = JSON.stringify(colors)
      } else if (typeof colors === 'string' && colors.trim() !== '') {
        // Se for string, tentar parsear ou usar como array
        try {
          const parsed = JSON.parse(colors)
          if (Array.isArray(parsed) && parsed.length > 0) {
            finalColors = colors
          }
        } catch {
          // Se não for JSON válido, tratar como string separada por vírgulas
          const colorsArray = colors.split(',').map(c => c.trim()).filter(c => c.length > 0)
          if (colorsArray.length > 0) {
            finalColors = JSON.stringify(colorsArray)
          }
        }
      }
    }

    const item = await prisma.clothingItem.create({
      data: {
        category,
        subcategory: hasSubcategory ? subcategory : null,
        size: finalSize,
        sizeOptionId: finalSizeOptionId,
        colors: finalColors,
        photo: photo || null,
        status: status || 'IN_USE',
        disposition: disposition || 'KEEP',
        isSet: isSet || false,
        setItemId: normalizedSetItemId,
        needsClassification: itemNeedsClassification,
        childId,
      },
    })

    return NextResponse.json(item)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao criar item' },
      { status: 500 }
    )
  }
}

