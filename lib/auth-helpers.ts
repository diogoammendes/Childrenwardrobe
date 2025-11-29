import { Session } from 'next-auth'

/**
 * Verifica se o utilizador tem uma role específica
 */
export function hasRole(session: Session | null, role: string): boolean {
  if (!session?.user) return false
  return session.user.roles?.includes(role) || session.user.role === role || false
}

/**
 * Verifica se o utilizador tem pelo menos uma das roles especificadas
 */
export function hasAnyRole(session: Session | null, roles: string[]): boolean {
  if (!session?.user) return false
  const userRoles = session.user.roles || [session.user.role]
  return roles.some(role => userRoles.includes(role))
}

