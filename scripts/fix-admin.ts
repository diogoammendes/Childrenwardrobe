import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Verificando e corrigindo utilizador admin...')

  const adminEmail = 'admin@example.com'
  const adminPassword = 'admin123'

  // Verificar se o admin existe
  let admin = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { userRoles: true },
  })

  if (!admin) {
    console.log('❌ Utilizador admin não encontrado. A criar...')
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Administrador',
        userRoles: {
          create: [
            { role: UserRole.ADMIN },
            { role: UserRole.PARENT },
          ],
        },
      },
      include: { userRoles: true },
    })
    console.log('✅ Utilizador admin criado!')
  } else {
    console.log('✅ Utilizador admin encontrado')
    
    // Verificar e corrigir roles
    const adminRoles = admin.userRoles.map(ur => ur.role)
    const hasAdminRole = adminRoles.includes(UserRole.ADMIN)
    const hasParentRole = adminRoles.includes(UserRole.PARENT)

    if (!hasAdminRole || !hasParentRole) {
      console.log('🔧 A corrigir roles do admin...')
      
      if (!hasAdminRole) {
        await prisma.userRoleAssignment.create({
          data: {
            userId: admin.id,
            role: UserRole.ADMIN,
          },
        })
        console.log('✅ Role ADMIN adicionada')
      }

      if (!hasParentRole) {
        await prisma.userRoleAssignment.create({
          data: {
            userId: admin.id,
            role: UserRole.PARENT,
          },
        })
        console.log('✅ Role PARENT adicionada')
      }
    } else {
      console.log('✅ Admin já tem todas as roles corretas')
    }

    // Resetar palavra-passe para o padrão
    console.log('🔧 A resetar palavra-passe para o padrão...')
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword },
    })
    console.log('✅ Palavra-passe resetada para: admin123')
  }

  console.log('\n📋 Credenciais do Admin:')
  console.log(`   Email: ${adminEmail}`)
  console.log(`   Password: ${adminPassword}`)
  console.log('\n✨ Processo concluído!')
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })




