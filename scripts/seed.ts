import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const defaultSizes = [
    { label: 'Recém-nascido', order: 1 },
    { label: '0-3 meses', order: 2 },
    { label: '3-6 meses', order: 3 },
    { label: '6-9 meses', order: 4 },
    { label: '9-12 meses', order: 5 },
    { label: '12-18 meses', order: 6 },
    { label: '2 anos', order: 7 },
    { label: '3 anos', order: 8 },
  ]

  for (const size of defaultSizes) {
    await prisma.sizeOption.upsert({
      where: { label: size.label },
      update: { order: size.order, isActive: true },
      create: {
        label: size.label,
        order: size.order,
        isActive: true,
      },
    })
  }

  console.log('✅ Tamanhos padrão sincronizados')

  // Criar utilizador admin padrão
  const adminEmail = 'admin@example.com'
  const adminPassword = 'admin123'

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    
      const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Administrador',
        userRoles: {
          create: [
            { role: 'ADMIN' },
            { role: 'PARENT' }, // Admin também pode ser pai/mãe
          ],
        },
      },
    })

    console.log('✅ Utilizador admin criado:')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)
  } else {
    // Garantir que o admin tem as roles ADMIN e PARENT
    const adminRoles = await prisma.userRoleAssignment.findMany({
      where: { userId: existingAdmin.id },
    })

    const hasAdminRole = adminRoles.some(r => r.role === 'ADMIN')
    const hasParentRole = adminRoles.some(r => r.role === 'PARENT')

    if (!hasAdminRole) {
      await prisma.userRoleAssignment.create({
        data: {
          userId: existingAdmin.id,
          role: 'ADMIN',
        },
      })
      console.log('✅ Role ADMIN adicionada ao utilizador admin existente')
    }

    if (!hasParentRole) {
      await prisma.userRoleAssignment.create({
        data: {
          userId: existingAdmin.id,
          role: 'PARENT',
        },
      })
      console.log('✅ Role PARENT adicionada ao utilizador admin existente')
    }

    if (hasAdminRole && hasParentRole) {
      console.log('ℹ️  Utilizador admin já existe com todas as roles')
    }
  }

  // Criar configuração padrão do nome da aplicação
  await prisma.appConfig.upsert({
    where: { key: 'app_name' },
    update: {},
    create: {
      key: 'app_name',
      value: 'Children Wardrobe',
    },
  })

  console.log('✅ Configuração padrão criada')

  console.log('✨ Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

