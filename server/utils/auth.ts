import type { User } from '#auth-utils'

export async function requireAuth(event: any): Promise<{ user: User }> {
  const session = await getUserSession(event)
  if (!session.user) throwServer(401, 'Authentication required')
  return { user: session.user }
}

export async function requireModerator(event: any): Promise<{ user: User }> {
  const { user } = await requireAuth(event)
  if (user.role !== 'admin' && user.role !== 'moderator') {
    throwServer(403, 'Admin or moderator access required')
  }
  return { user }
}

export async function requireAdmin(event: any): Promise<{ user: User }> {
  const { user } = await requireAuth(event)
  if (user.role !== 'admin') {
    throwServer(403, 'Admin access required')
  }
  return { user }
}
