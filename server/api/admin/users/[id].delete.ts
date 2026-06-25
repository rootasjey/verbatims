import { db, schema } from 'hub:db'
import { eq, count } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) {
      throwServer(401, 'Authentication required')
    }
    if (session.user.role !== 'admin') {
      throwServer(403, 'Admin access required')
    }

    const idParam = getRouterParam(event, 'id')
    if (!idParam || isNaN(parseInt(idParam))) {
      throwServer(400, 'Invalid user ID')
    }
    const userId = parseInt(idParam)

    if (userId === session.user.id) {
      throwServer(400, 'Cannot delete your own account')
    }

    const user = await db.select({ id: schema.users.id, role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1)
    
    if (!user || user.length === 0) {
      throwServer(404, 'User not found')
    }

    // Optional safeguard: prevent deleting the last admin
    if (user[0].role === 'admin') {
      const adminCountResult = await db.select({ count: count() })
        .from(schema.users)
        .where(eq(schema.users.role, 'admin'))
      
      const adminCount = Number(adminCountResult[0]?.count || 0)
      if (adminCount <= 1) {
        throwServer(400, 'Cannot delete the last admin')
      }
    }

    await db.delete(schema.users).where(eq(schema.users.id, userId))

    return { success: true, message: 'User deleted successfully' }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Admin delete user error:', error)
    throwServer(500, 'Failed to delete user')
  }
})
