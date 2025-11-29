import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { hasRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { hasChildAccess } from '@/lib/child-access'

// Partilhar criança com outro utilizador
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

    const child = await prisma.child.findUnique({
      where: { id: params.id },
    })

    if (!child) {
      return NextResponse.json(
        { error: 'Criança não encontrada' },
        { status: 404 }
      )
    }

    // Apenas o proprietário pode partilhar (ou admin)
    if (!hasRole(session, 'ADMIN') && child.parentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Apenas o proprietário pode partilhar a criança' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Encontrar o utilizador pelo email
    const userToShare = await prisma.user.findUnique({
      where: { email },
    })

    if (!userToShare) {
      return NextResponse.json(
        { error: 'Utilizador não encontrado' },
        { status: 404 }
      )
    }

    // Não pode partilhar consigo mesmo
    if (userToShare.id === session.user.id) {
      return NextResponse.json(
        { error: 'Não pode partilhar consigo mesmo' },
        { status: 400 }
      )
    }

    // Não pode partilhar com o proprietário (já tem acesso)
    if (userToShare.id === child.parentId) {
      return NextResponse.json(
        { error: 'Este utilizador já é o proprietário da criança' },
        { status: 400 }
      )
    }

    // Verificar se já está partilhado
    const existingShare = await prisma.childSharedWith.findUnique({
      where: {
        childId_userId: {
          childId: params.id,
          userId: userToShare.id,
        },
      },
    })

    if (existingShare) {
      return NextResponse.json(
        { error: 'Criança já está partilhada com este utilizador' },
        { status: 400 }
      )
    }

    // Criar partilha
    const share = await prisma.childSharedWith.create({
      data: {
        childId: params.id,
        userId: userToShare.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(share)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao partilhar criança' },
      { status: 500 }
    )
  }
}

// Listar utilizadores com quem a criança está partilhada
export async function GET(
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

    // Verificar acesso
    const hasAccess = await hasChildAccess(session.user.id, params.id)
    if (!hasAccess && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    const sharedWith = await prisma.childSharedWith.findMany({
      where: { childId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(sharedWith)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao listar partilhas' },
      { status: 500 }
    )
  }
}

