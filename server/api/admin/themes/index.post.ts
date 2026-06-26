import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const body = await readBody(event)
    const slug = String(body?.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const name = String(body?.name || '').trim()
    const description = body?.description || null
    const imageUrl = body?.image_url || null
    const isActive = body?.is_active === true
    const isDefault = body?.is_default === true
    const scheduledDate = body?.scheduled_date || null
    const scheduledStart = body?.scheduled_start || null
    const scheduledEnd = body?.scheduled_end || null
    const priority = parseInt(body?.priority ?? '0', 10) || 0
    const config = body?.config ? JSON.stringify(body.config) : '{}'

    if (!slug || slug.length < 2) {
      throwServer(400, 'Theme slug is required (min 2 chars)')
    }
    if (!name) {
      throwServer(400, 'Theme name is required')
    }

    const exists = await db.select({ id: schema.themes.id })
      .from(schema.themes)
      .where(eq(schema.themes.slug, slug))
      .limit(1)

    if (exists.length > 0) {
      throwServer(409, 'Theme with this slug already exists')
    }

    const result = await db.insert(schema.themes).values({
      slug,
      name,
      description,
      imageUrl,
      config,
      isActive,
      isDefault,
      scheduledDate,
      scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
      priority,
    }).returning()

    if (!result || result.length === 0) {
      throwServer(500, 'Failed to create theme')
    }

    return { success: true, data: result[0] }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error creating theme:', error)
    throwServer(500, 'Failed to create theme')
  }
})
