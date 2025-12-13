import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const configs = await prisma.appConfig.findMany()
    const configMap: Record<string, string> = {}
    
    configs.forEach(config => {
      configMap[config.key] = config.value
    })

    return NextResponse.json(configMap)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar configurações' },
      { status: 500 }
    )
  }
}

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
    const { key, value } = body

    if (!key || typeof value !== 'string') {
      return NextResponse.json(
        { error: 'Chave e valor são obrigatórios' },
        { status: 400 }
      )
    }

    const config = await prisma.appConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    return NextResponse.json(config)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar configuração' },
      { status: 500 }
    )
  }
}




