export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }
    if (session.user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
    }

    const idParam = getRouterParam(event, 'id')
    if (!idParam || isNaN(parseInt(idParam))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid user ID' })
    }
    const userId = parseInt(idParam)

    if (userId === session.user.id) {
      throw createError({ statusCode: 400, statusMessage: 'Cannot delete your own account' })
    }

    const db = hubDatabase()

    const user = await db.prepare('SELECT id, role FROM users WHERE id = ?').bind(userId).first()
    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    // Optional safeguard: prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCountRow = await db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin'").first()
      const adminCount = Number((adminCountRow as any)?.c || 0)
      if (adminCount <= 1) {
        throw createError({ statusCode: 400, statusMessage: 'Cannot delete the last admin' })
      }
    }

    await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run()

    return { success: true, message: 'User deleted successfully' }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Admin delete user error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete user' })
  }
})
