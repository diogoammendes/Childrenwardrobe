import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { label, description, order, isActive } = body

    const data: any = {}
    if (typeof label === 'string') data.label = label
    if (typeof description !== 'undefined') data.description = description
    if (typeof order === 'number') data.order = order
    if (typeof isActive === 'boolean') data.isActive = isActive

    const size = await prisma.sizeOption.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(size)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar tamanho' },
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

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await prisma.sizeOption.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao eliminar tamanho' },
      { status: 500 }
    )
  }
}

