import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { hasRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { hasChildAccess } from '@/lib/child-access'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const item = await prisma.clothingItem.findUnique({
      where: { id: params.id },
      include: { child: true },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item não encontrado' },
        { status: 404 }
      )
    }

    if (!hasRole(session, 'ADMIN')) {
      const hasAccess = await hasChildAccess(session.user.id, item.childId)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Não autorizado' },
          { status: 403 }
        )
      }
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
    } = body

    // Normalizar setItemId: string vazia ou null vira null
    let normalizedSetItemId: string | null = null
    if (setItemId !== undefined) {
      normalizedSetItemId = setItemId && setItemId.trim() !== '' ? setItemId : null
    } else {
      normalizedSetItemId = item.setItemId
    }

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

    let nextSizeLabel = item.size
    let nextSizeOptionId = item.sizeOptionId

    if (sizeOptionId !== undefined) {
      if (sizeOptionId === null || sizeOptionId === '') {
        nextSizeOptionId = null
        if (size !== undefined && size.trim() !== '') {
          nextSizeLabel = size
        }
      } else {
        const option = await prisma.sizeOption.findUnique({
          where: { id: sizeOptionId },
        })

        if (!option) {
          return NextResponse.json(
            { error: 'Tamanho selecionado não é válido' },
            { status: 400 }
          )
        }

        nextSizeOptionId = option.id
        nextSizeLabel = option.label
      }
    } else if (size !== undefined) {
      nextSizeLabel = size
    }

    // Determinar valores finais para verificar se precisa classificação
    const finalSubcategory = subcategory !== undefined ? subcategory : item.subcategory
    const finalColors = colors !== undefined ? JSON.stringify(colors) : item.colors
    const finalSize = nextSizeLabel
    const finalSizeOptionId = nextSizeOptionId

    // Verificar se todos os campos obrigatórios estão preenchidos
    const hasSubcategory = finalSubcategory && finalSubcategory.trim() !== ''
    let hasColors = false
    if (finalColors) {
      try {
        const parsedColors = JSON.parse(finalColors)
        hasColors = Array.isArray(parsedColors) && parsedColors.length > 0
      } catch {
        hasColors = false
      }
    }
    const hasSize = (finalSizeOptionId && finalSizeOptionId.trim() !== '') || (finalSize && finalSize.trim() !== '')
    
    // Se todos os campos estiverem preenchidos, não precisa mais classificação
    const needsClassification = !hasSubcategory || !hasColors || !hasSize

    const updated = await prisma.clothingItem.update({
      where: { id: params.id },
      data: {
        category: category !== undefined ? category : item.category,
        subcategory: finalSubcategory,
        size: finalSize,
        sizeOptionId: finalSizeOptionId,
        colors: finalColors,
        photo: photo !== undefined ? photo : item.photo,
        status: status !== undefined ? status : item.status,
        disposition: disposition !== undefined ? disposition : item.disposition,
        isSet: isSet !== undefined ? isSet : item.isSet,
        setItemId: normalizedSetItemId,
        needsClassification,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const item = await prisma.clothingItem.findUnique({
      where: { id: params.id },
      include: { child: true },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item não encontrado' },
        { status: 404 }
      )
    }

    if (!hasRole(session, 'ADMIN')) {
      const hasAccess = await hasChildAccess(session.user.id, item.childId)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Não autorizado' },
          { status: 403 }
        )
      }
    }

    await prisma.clothingItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao eliminar item' },
      { status: 500 }
    )
  }
}

