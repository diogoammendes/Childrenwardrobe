import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user.roles?.includes('ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email, password, role } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e palavra-passe são obrigatórios' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Normalizar roles
    const rolesArray = Array.isArray(role) 
      ? role.filter((r: string) => r === 'ADMIN' || r === 'PARENT')
      : role 
        ? [role as UserRole]
        : ['PARENT']

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
        userRoles: {
          create: rolesArray.map((r: UserRole) => ({
            role: r,
          })),
        },
      },
      include: {
        userRoles: true,
      },
    })

    // Não retornar a palavra-passe
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      ...userWithoutPassword,
      roles: user.userRoles.map((ur: { role: string }) => ur.role),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao criar utilizador' },
      { status: 500 }
    )
  }
}

