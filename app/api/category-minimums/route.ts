import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { hasRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

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
    const { category, subcategory, minimum, childId } = body

    if (!category || !subcategory || !minimum || !childId) {
      return NextResponse.json(
        { error: 'Campos obrigatórios em falta' },
        { status: 400 }
      )
    }

    const child = await prisma.child.findUnique({
      where: { id: childId },
    })

    if (!child) {
      return NextResponse.json(
        { error: 'Criança não encontrada' },
        { status: 404 }
      )
    }

    if (!hasRole(session, 'ADMIN') && child.parentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    const categoryMinimum = await prisma.categoryMinimum.upsert({
      where: {
        childId_category_subcategory: {
          childId,
          category,
          subcategory,
        },
      },
      update: {
        minimum,
      },
      create: {
        category,
        subcategory,
        minimum,
        childId,
      },
    })

    return NextResponse.json(categoryMinimum)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao criar mínimo' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')

    if (!childId) {
      return NextResponse.json(
        { error: 'ID da criança é obrigatório' },
        { status: 400 }
      )
    }

    const child = await prisma.child.findUnique({
      where: { id: childId },
    })

    if (!child) {
      return NextResponse.json(
        { error: 'Criança não encontrada' },
        { status: 404 }
      )
    }

    if (!hasRole(session, 'ADMIN') && child.parentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    const minimums = await prisma.categoryMinimum.findMany({
      where: { childId },
      orderBy: [{ category: 'asc' }, { subcategory: 'asc' }],
    })

    return NextResponse.json(minimums)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar mínimos' },
      { status: 500 }
    )
  }
}

