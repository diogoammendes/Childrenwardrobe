import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { hasRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

// Remover partilha de criança
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
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

    // Apenas o proprietário pode remover partilhas (ou admin)
    if (!hasRole(session, 'ADMIN') && child.parentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Apenas o proprietário pode remover partilhas' },
        { status: 403 }
      )
    }

    const share = await prisma.childSharedWith.findUnique({
      where: {
        childId_userId: {
          childId: params.id,
          userId: params.userId,
        },
      },
    })

    if (!share) {
      return NextResponse.json(
        { error: 'Partilha não encontrada' },
        { status: 404 }
      )
    }

    await prisma.childSharedWith.delete({
      where: {
        childId_userId: {
          childId: params.id,
          userId: params.userId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao remover partilha' },
      { status: 500 }
    )
  }
}

