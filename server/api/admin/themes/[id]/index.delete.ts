import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { deleteThemeImageIfUnused } from '~~/server/utils/theme-image-storage'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const id = getRouterParam(event, 'id')!
    if (!id || isNaN(parseInt(id))) {
      throwServer(400, 'Invalid theme ID')
    }
    const themeId = parseInt(id)

    const existing = await db.select({
      id: schema.themes.id,
      imageUrl: schema.themes.imageUrl,
      mobileImageUrl: schema.themes.mobileImageUrl,
    })
      .from(schema.themes)
      .where(eq(schema.themes.id, themeId))
      .limit(1)

    if (!existing || existing.length === 0) {
      throwServer(404, 'Theme not found')
    }
    const existingTheme = existing[0]!

    await db.delete(schema.themes).where(eq(schema.themes.id, themeId))
    await Promise.all([existingTheme.imageUrl, existingTheme.mobileImageUrl]
      .map(url => deleteThemeImageIfUnused(url)))

    return { success: true, data: { deleted: true } }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error deleting theme:', error)
    throwServer(500, 'Failed to delete theme')
  }
})
