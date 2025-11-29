import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateUserRoles } from '@/lib/user-helpers'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user.roles?.includes('ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        userRoles: true,
        _count: {
          select: { children: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilizador não encontrado' },
        { status: 404 }
      )
    }

    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json({
      ...userWithoutPassword,
      roles: user.userRoles.map(ur => ur.role),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar utilizador' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user.roles?.includes('ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email, password, roles } = body

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilizador não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o email já está em uso por outro utilizador
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email já está em uso' },
          { status: 400 }
        )
      }
    }

    // Atualizar dados básicos
    const updateData: any = {}
    if (name !== undefined) updateData.name = name || null
    if (email !== undefined) updateData.email = email
    if (password !== undefined && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    })

    // Atualizar roles se fornecidas
    if (roles && Array.isArray(roles)) {
      const validRoles = roles.filter((r: string) => 
        r === 'ADMIN' || r === 'PARENT'
      ) as UserRole[]
      await updateUserRoles(params.id, validRoles)
    }

    // Buscar utilizador atualizado com roles
    const userWithRoles = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        userRoles: true,
      },
    })

    const { password: _, ...userWithoutPassword } = updatedUser
    return NextResponse.json({
      ...userWithoutPassword,
      roles: userWithRoles?.userRoles.map((ur: { role: string }) => ur.role) || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar utilizador' },
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
    
    if (!session || !session.user.roles?.includes('ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Não permitir eliminar o próprio utilizador
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Não pode eliminar o seu próprio utilizador' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao eliminar utilizador' },
      { status: 500 }
    )
  }
}

