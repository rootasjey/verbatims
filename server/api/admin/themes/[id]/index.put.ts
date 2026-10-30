import { db, schema } from 'hub:db'
import { eq, ne, sql } from 'drizzle-orm'
import { enrichThemeFilters } from '~~/server/utils/theme-enrichment'
import { scheduleBackground } from '~~/server/utils/schedule'
import { deleteThemeImageIfUnused, finishThemeImageCommit, prepareThemeImageCommit, rollbackThemeImageCommit } from '~~/server/utils/theme-image-storage'
import { enqueueThemeLaunch } from '~~/server/utils/social-theme-launch'

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
    const existingTheme = existing[0]!

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
    for (const [bodyKey, schemaKey] of [
      ['image_url', 'imageUrl'],
      ['image_alt', 'imageAlt'],
      ['image_credit', 'imageCredit'],
      ['image_source_url', 'imageSourceUrl'],
      ['image_license', 'imageLicense'],
      ['image_date', 'imageDate'],
      ['image_location', 'imageLocation'],
      ['mobile_image_url', 'mobileImageUrl'],
      ['mobile_image_alt', 'mobileImageAlt'],
      ['mobile_image_credit', 'mobileImageCredit'],
      ['mobile_image_source_url', 'mobileImageSourceUrl'],
      ['mobile_image_license', 'mobileImageLicense'],
      ['mobile_image_date', 'mobileImageDate'],
      ['mobile_image_location', 'mobileImageLocation'],
    ] as const) {
      if (body[bodyKey] !== undefined) {
        updates[schemaKey] = typeof body[bodyKey] === 'string' ? body[bodyKey].trim() || null : null
      }
    }
    if (body.language !== undefined) {
      updates.language = body.language
    }
    if (body.is_active !== undefined) {
      updates.isActive = body.is_active === true
    }
    if (body.is_default !== undefined) {
      updates.isDefault = body.is_default === true
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

    const imageCommit = await prepareThemeImageCommit(
      updates.imageUrl !== undefined ? updates.imageUrl : existingTheme.imageUrl,
      updates.mobileImageUrl !== undefined ? updates.mobileImageUrl : existingTheme.mobileImageUrl,
    )
    if (imageCommit.imageUrl !== existingTheme.imageUrl) updates.imageUrl = imageCommit.imageUrl
    if (imageCommit.mobileImageUrl !== existingTheme.mobileImageUrl) updates.mobileImageUrl = imageCommit.mobileImageUrl

    const stmts: any[] = []

    try {
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
            body.translations.map((t: { language: string; name: string; description?: string | null; home_copy?: object | null }) => ({
              themeId,
              language: t.language,
              name: t.name,
              description: t.description || null,
              homeCopy: t.home_copy ? JSON.stringify(t.home_copy) : null,
            }))
          ))
        }
      }

      if (stmts.length > 0) await db.batch(stmts as any)
    } catch (error) {
      await rollbackThemeImageCommit(imageCommit)
      throw error
    }
    const updated = await db.select()
      .from(schema.themes)
      .where(eq(schema.themes.id, themeId))
      .limit(1)

    if (!existingTheme.isActive && updated[0]?.isActive) await enqueueThemeLaunch(themeId)

    // Background enrichment (only if theme has filters)
    const existingFilters = await db.select({ id: schema.themeContentFilters.id })
      .from(schema.themeContentFilters)
      .where(eq(schema.themeContentFilters.themeId, themeId))
      .all()
    if (existingFilters.length > 0) {
      scheduleBackground(event, enrichThemeFilters(themeId, user.id))
    }

    await finishThemeImageCommit(imageCommit)
    const newImageUrls = [imageCommit.imageUrl, imageCommit.mobileImageUrl]
    const oldImageUrls = [existingTheme.imageUrl, existingTheme.mobileImageUrl]
    await Promise.all(oldImageUrls
      .filter((url): url is string => !!url && !newImageUrls.includes(url))
      .map(url => deleteThemeImageIfUnused(url)))

    return { success: true, data: updated[0] }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    const msg = error?.message || String(error)
    console.error('Error updating theme:', msg)
    throwServer(500, msg)
  }
})
