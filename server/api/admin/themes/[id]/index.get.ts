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

    const theme = await db.select()
      .from(schema.themes)
      .where(eq(schema.themes.id, themeId))
      .limit(1)
      .get()

    if (!theme) {
      throwServer(404, 'Theme not found')
    }

    const [filters, translations] = await Promise.all([
      db.select()
        .from(schema.themeContentFilters)
        .where(eq(schema.themeContentFilters.themeId, themeId))
        .all(),
      db.select()
        .from(schema.themeTranslations)
        .where(eq(schema.themeTranslations.themeId, themeId))
        .all(),
    ])

    return {
      success: true,
      data: { ...theme, filters, translations },
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error fetching theme:', error)
    throwServer(500, 'Failed to fetch theme')
  }
})
