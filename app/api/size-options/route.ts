import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const sizes = await prisma.sizeOption.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(sizes)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao listar tamanhos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { label, description, order } = body

    if (!label) {
      return NextResponse.json(
        { error: 'O nome do tamanho é obrigatório' },
        { status: 400 }
      )
    }

    const size = await prisma.sizeOption.create({
      data: {
        label,
        description: description || null,
        order:
          typeof order === 'number'
            ? order
            : await prisma.sizeOption.count().then((count) => count + 1),
      },
    })

    return NextResponse.json(size)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao criar tamanho' },
      { status: 500 }
    )
  }
}

