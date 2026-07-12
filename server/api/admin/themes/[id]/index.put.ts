import { db, schema } from 'hub:db'
import { eq, ne, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const id = getRouterParam(event, 'id')!
    if (!id || isNaN(parseInt(id))) {
      throwServer(400, 'Invalid theme ID')
    }
    const themeId = parseInt(id)
    const body = await readBody(event)

    const existing = await db.select()
      .from(schema.themes)
      .where(eq(schema.themes.id, themeId))
      .limit(1)

    if (!existing || existing.length === 0) {
      throwServer(404, 'Theme not found')
    }

    if (typeof body.slug === 'string' && body.slug.trim()) {
      const slug = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
      const conflict = await db.select({ id: schema.themes.id })
        .from(schema.themes)
        .where(sql`${schema.themes.slug} = ${slug} AND ${schema.themes.id} != ${themeId}`)
        .limit(1)

      if (conflict.length > 0) {
        throwServer(409, 'Theme with this slug already exists')
      }
    }

    const updates: any = {}
    if (typeof body.slug === 'string' && body.slug.trim()) {
      updates.slug = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
    }
    if (typeof body.name === 'string' && body.name.trim()) {
      updates.name = body.name.trim()
    }
    if (body.description !== undefined) {
      updates.description = body.description
    }
    if (body.language !== undefined) {
      updates.language = body.language
    }
    if (body.image_url !== undefined) {
      updates.imageUrl = body.image_url
    }
    if (body.is_active !== undefined) {
      updates.isActive = body.is_active === true
    }
    if (body.is_default !== undefined) {
      updates.isDefault = body.is_default === true
    }
    if (body.scheduled_date !== undefined) {
      updates.scheduledDate = body.scheduled_date
    }
    if (body.scheduled_start !== undefined) {
      updates.scheduledStart = body.scheduled_start ? new Date(body.scheduled_start) : null
    }
    if (body.scheduled_end !== undefined) {
      updates.scheduledEnd = body.scheduled_end ? new Date(body.scheduled_end) : null
    }
    if (body.priority !== undefined) {
      updates.priority = parseInt(body.priority, 10) || 0
    }
    if (body.config !== undefined) {
      updates.config = typeof body.config === 'string' ? body.config : JSON.stringify(body.config)
    }

    const stmts: any[] = []

    if (Object.keys(updates).length > 0) {
      stmts.push(db.update(schema.themes)
        .set(updates)
        .where(eq(schema.themes.id, themeId)))
    }

    if (Array.isArray(body.translations)) {
      stmts.push(db.delete(schema.themeTranslations)
        .where(eq(schema.themeTranslations.themeId, themeId)))

      if (body.translations.length > 0) {
        stmts.push(db.insert(schema.themeTranslations).values(
          body.translations.map((t: { language: string; name: string; description?: string | null }) => ({
            themeId,
            language: t.language,
            name: t.name,
            description: t.description || null,
          }))
        ))
      }
    }

    if (stmts.length > 0) {
      await db.batch(stmts as any)
    }

    const updated = await db.select()
      .from(schema.themes)
      .where(eq(schema.themes.id, themeId))
      .limit(1)

    return { success: true, data: updated[0] }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error updating theme:', error)
    throwServer(500, 'Failed to update theme')
  }
})
