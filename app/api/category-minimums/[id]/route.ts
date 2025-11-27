import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const minimum = await prisma.categoryMinimum.findUnique({
      where: { id: params.id },
      include: { child: true },
    })

    if (!minimum) {
      return NextResponse.json(
        { error: 'Mínimo não encontrado' },
        { status: 404 }
      )
    }

    if (session.user.role === 'PARENT' && minimum.child.parentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    await prisma.categoryMinimum.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao eliminar mínimo' },
      { status: 500 }
    )
  )
}

