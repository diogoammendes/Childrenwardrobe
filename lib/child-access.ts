import { prisma } from '@/lib/prisma'

/**
 * Verifica se um utilizador tem acesso a uma criança
 * (seja como proprietário ou como partilhado)
 */
export async function hasChildAccess(userId: string, childId: string): Promise<boolean> {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: {
      sharedWith: {
        where: { userId },
      },
    },
  })

  if (!child) {
    return false
  }

  // Verifica se é o proprietário
  if (child.parentId === userId) {
    return true
  }

  // Verifica se está na lista de partilhados
  if (child.sharedWith.length > 0) {
    return true
  }

  return false
}

/**
 * Obtém todas as crianças a que um utilizador tem acesso
 */
export async function getAccessibleChildren(userId: string) {
  return await prisma.child.findMany({
    where: {
      OR: [
        { parentId: userId },
        { sharedWith: { some: { userId } } },
      ],
    },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
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
}

