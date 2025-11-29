import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

/**
 * Verifica se um utilizador tem uma role específica
 */
export async function userHasRole(userId: string, role: UserRole): Promise<boolean> {
  const userRole = await prisma.userRoleAssignment.findUnique({
    where: {
      userId_role: {
        userId,
        role,
      },
    },
  })
  return !!userRole
}

/**
 * Verifica se um utilizador tem pelo menos uma das roles especificadas
 */
export async function userHasAnyRole(userId: string, roles: UserRole[]): Promise<boolean> {
  const userRoles = await prisma.userRoleAssignment.findMany({
    where: {
      userId,
      role: {
        in: roles,
      },
    },
  })
  return userRoles.length > 0
}

/**
 * Obtém todas as roles de um utilizador
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const userRoles = await prisma.userRoleAssignment.findMany({
    where: { userId },
    select: { role: true },
  })
  return userRoles.map(ur => ur.role)
}

/**
 * Atualiza as roles de um utilizador
 */
export async function updateUserRoles(userId: string, roles: UserRole[]): Promise<void> {
  // Remover todas as roles existentes
  await prisma.userRoleAssignment.deleteMany({
    where: { userId },
  })

  // Adicionar as novas roles
  if (roles.length > 0) {
    await prisma.userRoleAssignment.createMany({
      data: roles.map(role => ({
        userId,
        role,
      })),
      skipDuplicates: true,
    })
  }
}

