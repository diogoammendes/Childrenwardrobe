import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Migrando roles de utilizadores...')

  // Buscar todos os utilizadores que ainda não têm roles na tabela UserRole
  const users = await prisma.user.findMany({
    include: {
      userRoles: true,
    },
  })

  for (const user of users) {
    // Se o utilizador já tem roles, pular
    if (user.userRoles.length > 0) {
      console.log(`⏭️  Utilizador ${user.email} já tem roles, a pular...`)
      continue
    }

    // Tentar obter a role antiga do campo 'role' (se ainda existir)
    // Como removemos o campo, vamos assumir PARENT como padrão
    // e verificar se há algum indicador de admin
    const defaultRole = 'PARENT'

    // Criar role padrão
    await prisma.userRoleAssignment.create({
      data: {
        userId: user.id,
        role: defaultRole,
      },
    })

    console.log(`✅ Role ${defaultRole} adicionada ao utilizador ${user.email}`)
  }

  console.log('✨ Migração concluída!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

