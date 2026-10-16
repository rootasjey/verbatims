import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const body = await readBody(event)
    const slug = String(body?.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const name = String(body?.name || '').trim()
    const description = body?.description || null
    const language = body?.language || null
    const imageFields = {
      imageUrl: String(body?.image_url || '').trim() || null,
      imageAlt: String(body?.image_alt || '').trim() || null,
      imageCredit: String(body?.image_credit || '').trim() || null,
      imageSourceUrl: String(body?.image_source_url || '').trim() || null,
      imageLicense: String(body?.image_license || '').trim() || null,
      imageDate: String(body?.image_date || '').trim() || null,
      imageLocation: String(body?.image_location || '').trim() || null,
    }
    const translations = Array.isArray(body?.translations) ? body.translations : []
    const isActive = body?.is_active === true
    const isDefault = body?.is_default === true
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

    await db.insert(schema.themes).values({
      slug,
      name,
      description,
      language,
      ...imageFields,
      config,
      isActive,
      isDefault,
      scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
      priority,
    })

    const theme = await db.select()
      .from(schema.themes)
      .where(eq(schema.themes.slug, slug))
      .limit(1)
      .get()
    if (!theme) {
      throwServer(500, 'Failed to create theme')
    }

    if (translations.length > 0) {
      await db.insert(schema.themeTranslations).values(
          translations.map((t: { language: string; name: string; description?: string | null; home_copy?: object | null }) => ({
          themeId: theme.id,
          language: t.language,
          name: t.name,
            description: t.description || null,
            homeCopy: t.home_copy ? JSON.stringify(t.home_copy) : null,
        }))
      )
    }

    return { success: true, data: theme }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    const msg = error?.message || String(error)
    console.error('Error creating theme:', msg)
    throwServer(500, msg)
  }
})
