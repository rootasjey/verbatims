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
    const body = await readBody(event)
    const homeIsActive = body?.home_is_active === undefined
      ? body?.is_active === true
      : body.home_is_active === true
    const current = await db.select({ homeIsActive: schema.themes.homeIsActive }).from(schema.themes).where(eq(schema.themes.id, themeId)).limit(1).get()
    if (!current) throwServer(404, 'Theme not found')

    await db.update(schema.themes)
      .set({ homeIsActive, isActive: homeIsActive })
      .where(eq(schema.themes.id, themeId))

    return { success: true, data: { id: themeId, home_is_active: homeIsActive, is_active: homeIsActive } }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error toggling theme activation:', error)
    throwServer(500, 'Failed to toggle theme activation')
  }
})
