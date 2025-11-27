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
        setItemId: setItemId || null,
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

