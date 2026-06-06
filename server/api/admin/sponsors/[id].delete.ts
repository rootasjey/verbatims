import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  try {
    const id = getRouterParam(event, 'id')
    if (!id || isNaN(parseInt(id))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid sponsor message ID' })
    }
    const sponsorId = parseInt(id)

    await db.delete(schema.sponsorMessages).where(eq(schema.sponsorMessages.id, sponsorId))

    return { success: true, data: { deleted: true } }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error deleting sponsor message:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete sponsor message' })
  }
})
