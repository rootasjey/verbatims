import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throwServer(403, 'Admin access required')
  }

  const id = getRouterParam(event, 'id')!
  if (!id || isNaN(parseInt(id))) {
    throwServer(400, 'Invalid sponsor message ID')
  }
  const sponsorId = parseInt(id)

  try {
    const row = await db.select()
      .from(schema.sponsorMessages)
      .where(eq(schema.sponsorMessages.id, sponsorId))
      .limit(1)

    if (!row || row.length === 0) {
      throwServer(404, 'Sponsor message not found')
    }

    return { success: true, data: row[0] }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error fetching sponsor message:', error)
    throwServer(500, 'Failed to fetch sponsor message')
  }
})
