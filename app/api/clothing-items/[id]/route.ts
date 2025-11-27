import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    if (session.user.role === 'PARENT' && item.child.parentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
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
    } = body

    const updated = await prisma.clothingItem.update({
      where: { id: params.id },
      data: {
        category: category !== undefined ? category : item.category,
        subcategory: subcategory !== undefined ? subcategory : item.subcategory,
        size: size !== undefined ? size : item.size,
        colors: colors !== undefined ? JSON.stringify(colors) : item.colors,
        photo: photo !== undefined ? photo : item.photo,
        status: status !== undefined ? status : item.status,
        disposition: disposition !== undefined ? disposition : item.disposition,
        isSet: isSet !== undefined ? isSet : item.isSet,
        setItemId: setItemId !== undefined ? setItemId : item.setItemId,
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

    if (session.user.role === 'PARENT' && item.child.parentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
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

