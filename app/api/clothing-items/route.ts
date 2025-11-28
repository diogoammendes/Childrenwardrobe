import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
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
      colors,
      photo,
      status,
      disposition,
      isSet,
      setItemId,
      childId,
    } = body

    if (!category || !subcategory || !size || !colors || !childId) {
      return NextResponse.json(
        { error: 'Campos obrigatórios em falta' },
        { status: 400 }
      )
    }

    // Verificar se o utilizador tem acesso a esta criança
    if (session.user.role === 'PARENT') {
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

    const item = await prisma.clothingItem.create({
      data: {
        category,
        subcategory,
        size,
        colors: JSON.stringify(colors),
        photo: photo || null,
        status: status || 'IN_USE',
        disposition: disposition || 'KEEP',
        isSet: isSet || false,
        setItemId: normalizedSetItemId,
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

