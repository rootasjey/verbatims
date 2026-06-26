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

    const existing = await db.select({ id: schema.themes.id })
      .from(schema.themes)
      .where(eq(schema.themes.id, themeId))
      .limit(1)

    if (!existing || existing.length === 0) {
      throwServer(404, 'Theme not found')
    }

    await db.delete(schema.themes).where(eq(schema.themes.id, themeId))

    return { success: true, data: { deleted: true } }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error deleting theme:', error)
    throwServer(500, 'Failed to delete theme')
  }
})
