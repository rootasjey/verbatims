import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const id = getRouterParam(event, 'id')!
    if (!id || isNaN(parseInt(id))) {
      throwServer(400, 'Invalid sponsor message ID')
    }
    const sponsorId = parseInt(id)

    await db.delete(schema.sponsorMessages).where(eq(schema.sponsorMessages.id, sponsorId))

    return { success: true, data: { deleted: true } }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error deleting sponsor message:', error)
    throwServer(500, 'Failed to delete sponsor message')
  }
})
