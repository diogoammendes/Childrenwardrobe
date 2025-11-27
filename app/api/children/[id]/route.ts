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

    const child = await prisma.child.findUnique({
      where: { id: params.id },
    })

    if (!child) {
      return NextResponse.json(
        { error: 'Criança não encontrada' },
        { status: 404 }
      )
    }

    if (session.user.role === 'PARENT' && child.parentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { height, weight, shoeSize } = body

    const updated = await prisma.child.update({
      where: { id: params.id },
      data: {
        height: height !== undefined ? height : child.height,
        weight: weight !== undefined ? weight : child.weight,
        shoeSize: shoeSize !== undefined ? shoeSize : child.shoeSize,
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

