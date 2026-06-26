import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { toggleLike } from '../../../services/like.service'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event)

    const authorId = parseIntParam(getRouterParam(event, 'id'))
    if (!authorId) throwServer(400, 'Invalid author ID')

    const author = await db.select({ id: schema.authors.id })
      .from(schema.authors)
      .where(eq(schema.authors.id, authorId))
      .get()

    if (!author) throwServer(404, 'Author not found')

    const result = await toggleLike('author', authorId, user.id)

    return { success: true, data: result }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error toggling author like:', error)
    throwServer(500, 'Failed to toggle like')
  }
})
