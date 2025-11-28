import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
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

    const child = await prisma.child.findUnique({
      where: { id: params.id },
    })

    if (!child) {
      return NextResponse.json(
        { error: 'Criança não encontrada' },
        { status: 404 }
      )
    }

    if (session.user.role === 'PARENT') {
      const hasAccess = await hasChildAccess(session.user.id, params.id)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Não autorizado' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { height, weight, shoeSize, photo, currentSizeId, secondarySizeId } = body

    const sizeIds = [currentSizeId, secondarySizeId].filter(Boolean) as string[]
    if (sizeIds.length > 0) {
      const existing = await prisma.sizeOption.findMany({
        where: { id: { in: sizeIds } },
        select: { id: true },
      })

      if (existing.length !== sizeIds.length) {
        return NextResponse.json(
          { error: 'Tamanho selecionado inválido' },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.child.update({
      where: { id: params.id },
      data: {
        height: height !== undefined ? height : child.height,
        weight: weight !== undefined ? weight : child.weight,
        shoeSize: shoeSize !== undefined ? shoeSize : child.shoeSize,
        photo: photo !== undefined ? photo : child.photo,
        currentSizeId:
          currentSizeId !== undefined ? (currentSizeId || null) : child.currentSizeId,
        secondarySizeId:
          secondarySizeId !== undefined ? (secondarySizeId || null) : child.secondarySizeId,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar criança' },
      { status: 500 }
    )
  }
}

