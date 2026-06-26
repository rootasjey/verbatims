import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { toggleLike } from '../../../services/like.service'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event)

    const refId = parseIntParam(getRouterParam(event, 'id'))
    if (!refId) throwServer(400, 'Invalid reference ID')

    const ref = await db.select({ id: schema.quoteReferences.id })
      .from(schema.quoteReferences)
      .where(eq(schema.quoteReferences.id, refId))
      .get()

    if (!ref) throwServer(404, 'Reference not found')

    const result = await toggleLike('reference', refId, user.id)

    return { success: true, data: result }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error toggling reference like:', error)
    throwServer(500, 'Failed to toggle like')
  }
})
