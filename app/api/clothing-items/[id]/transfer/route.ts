import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { hasRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { hasChildAccess } from '@/lib/child-access'

export async function POST(
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
    const { childId } = body

    if (!childId) {
      return NextResponse.json(
        { error: 'ID da criança é obrigatório' },
        { status: 400 }
      )
    }

    const targetChild = await prisma.child.findUnique({
      where: { id: childId },
    })

    if (!targetChild) {
      return NextResponse.json(
        { error: 'Criança de destino não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o utilizador tem acesso a ambas as crianças
    if (!hasRole(session, 'ADMIN')) {
      const hasAccessToSource = await hasChildAccess(session.user.id, item.childId)
      const hasAccessToTarget = await hasChildAccess(session.user.id, childId)
      
      if (!hasAccessToSource || !hasAccessToTarget) {
        return NextResponse.json(
          { error: 'Só pode transferir entre crianças a que tem acesso' },
          { status: 403 }
        )
      }
    }

    const updated = await prisma.clothingItem.update({
      where: { id: params.id },
      data: {
        childId,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao transferir item' },
      { status: 500 }
    )
  }
}

