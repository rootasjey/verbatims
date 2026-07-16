import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const id = getRouterParam(event, 'id')!
    if (!id || isNaN(parseInt(id))) {
      throwServer(400, 'Invalid theme ID')
    }
    const themeId = parseInt(id)

    const rows = await db.select()
      .from(schema.entitySuggestions)
      .where(eq(schema.entitySuggestions.themeId, themeId))
      .orderBy(schema.entitySuggestions.createdAt)
      .all()

    return { success: true, data: rows }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error fetching entity suggestions:', error)
    throwServer(500, 'Failed to fetch entity suggestions')
  }
})
