import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

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
      throw createError({ statusCode: 400, statusMessage: 'Theme slug is required (min 2 chars)' })
    }
    if (!name) {
      throw createError({ statusCode: 400, statusMessage: 'Theme name is required' })
    }

    const exists = await db.select({ id: schema.themes.id })
      .from(schema.themes)
      .where(eq(schema.themes.slug, slug))
      .limit(1)

    if (exists.length > 0) {
      throw createError({ statusCode: 409, statusMessage: 'Theme with this slug already exists' })
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
      throw createError({ statusCode: 500, statusMessage: 'Failed to create theme' })
    }

    return { success: true, data: result[0] }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error creating theme:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to create theme' })
  }
})
