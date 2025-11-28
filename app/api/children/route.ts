import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAccessibleChildren } from '@/lib/child-access'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, gender, birthDate, photo } = body

    if (!name || !gender || !birthDate) {
      return NextResponse.json(
        { error: 'Campos obrigatórios em falta' },
        { status: 400 }
      )
    }

    const child = await prisma.child.create({
      data: {
        name,
        gender,
        birthDate: new Date(birthDate),
        photo: photo || null,
        parentId: session.user.id,
      },
    })

    return NextResponse.json(child)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao criar criança' },
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

    if (session.user.role === 'ADMIN') {
      const children = await prisma.child.findMany({
        include: { 
          parent: { select: { name: true, email: true } },
          sharedWith: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(children)
    }

    const children = await getAccessibleChildren(session.user.id)
    return NextResponse.json(children)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar crianças' },
      { status: 500 }
    )
  }
}

