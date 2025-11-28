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
    
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN',
      },
    })

    console.log('✅ Utilizador admin criado:')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)
  } else {
    console.log('ℹ️  Utilizador admin já existe')
  }

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

