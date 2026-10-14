import { and, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { themeManifestSchema } from '../../../utils/theme-manifest'

defineRouteMeta({
  openAPI: {
    summary: 'Apply a declarative theme manifest',
    description: 'Creates or updates a theme by slug and reconciles its translations and content filters. Activation and default status are intentionally managed separately.',
    tags: ['Themes'],
    security: [{ apiKey: ['admin:themes'] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { type: 'object', required: ['schema_version', 'slug', 'name', 'filters'] } } },
    },
    responses: {
      '200': { description: 'Theme updated from manifest' },
      '201': { description: 'Theme created from manifest' },
      '400': { description: 'Manifest validation failed' },
      '409': { description: 'Theme slug already exists' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'moderator', 'admin')
  requireApiPermission(api, 'admin:themes')

  const manifest = await readValidatedBody(event, themeManifestSchema.parse)
  const existing = await db.select({ id: schema.themes.id })
    .from(schema.themes)
    .where(eq(schema.themes.slug, manifest.slug))
    .get()

  const now = new Date()
  let themeId = existing?.id
  let operation: 'created' | 'updated' = 'updated'

  const metadata = {
    name: manifest.name,
    updatedAt: now,
    ...(manifest.description !== undefined ? { description: manifest.description } : existing ? {} : { description: null }),
    ...(manifest.language !== undefined ? { language: manifest.language } : existing ? {} : { language: null }),
    ...(manifest.priority !== undefined ? { priority: manifest.priority } : existing ? {} : { priority: 0 }),
    ...(manifest.config !== undefined ? { config: manifest.config == null ? '{}' : JSON.stringify(manifest.config) } : existing ? {} : { config: '{}' }),
  }

  if (existing) {
    const [existingFilters, existingTranslations] = await Promise.all([
      db.select().from(schema.themeContentFilters).where(eq(schema.themeContentFilters.themeId, existing.id)).all(),
      manifest.translations !== undefined
        ? db.select().from(schema.themeTranslations).where(eq(schema.themeTranslations.themeId, existing.id)).all()
        : Promise.resolve([]),
    ])

    const desiredFilterKeys = new Set<string>()
    const statements: any[] = [
      db.update(schema.themes).set(metadata).where(eq(schema.themes.id, existing.id)),
    ]

    for (const filter of manifest.filters) {
      const key = `${filter.type}:${filter.value.toLowerCase()}`
      desiredFilterKeys.add(key)
      const current = existingFilters.find(item => `${item.type}:${item.value.toLowerCase()}` === key)
      if (!current) {
        statements.push(db.insert(schema.themeContentFilters).values({
          themeId: existing.id,
          type: filter.type,
          value: filter.value,
          matchMode: filter.match_mode,
        }))
      } else if (current.matchMode !== filter.match_mode || current.value !== filter.value) {
        statements.push(db.update(schema.themeContentFilters)
          .set({ value: filter.value, matchMode: filter.match_mode })
          .where(eq(schema.themeContentFilters.id, current.id)))
      }
    }

    const removedFilterIds = existingFilters
      .filter(item => !desiredFilterKeys.has(`${item.type}:${item.value.toLowerCase()}`))
      .map(item => item.id)
    for (const id of removedFilterIds) {
      statements.push(db.delete(schema.themeContentFilters).where(eq(schema.themeContentFilters.id, id)))
    }

    if (manifest.translations !== undefined) {
      const desiredLanguages = new Set<string>(manifest.translations.map(item => item.language))
      for (const translation of manifest.translations) {
        const current = existingTranslations.find(item => item.language === translation.language)
        if (current) {
          statements.push(db.update(schema.themeTranslations).set({
            name: translation.name,
            ...(translation.description !== undefined ? { description: translation.description } : {}),
            ...(translation.home_copy !== undefined
              ? { homeCopy: translation.home_copy === null ? null : JSON.stringify(translation.home_copy) }
              : {}),
          }).where(eq(schema.themeTranslations.id, current.id)))
        } else {
          statements.push(db.insert(schema.themeTranslations).values({
            themeId: existing.id,
            language: translation.language,
            name: translation.name,
            description: translation.description ?? null,
            homeCopy: translation.home_copy == null ? null : JSON.stringify(translation.home_copy),
          }))
        }
      }

      for (const translation of existingTranslations) {
        if (!desiredLanguages.has(translation.language)) {
          statements.push(db.delete(schema.themeTranslations).where(eq(schema.themeTranslations.id, translation.id)))
        }
      }
    }

    await db.batch(statements as any)
  } else {
    operation = 'created'
    let created
    try {
      created = await db.insert(schema.themes).values({
        slug: manifest.slug,
        ...metadata,
        isActive: false,
        isDefault: false,
      }).returning({ id: schema.themes.id }).get()
    } catch (error) {
      const concurrentTheme = await db.select({ id: schema.themes.id })
        .from(schema.themes)
        .where(eq(schema.themes.slug, manifest.slug))
        .get()
      if (concurrentTheme) throwServer(409, 'Theme with this slug already exists')
      throw error
    }
    if (!created) throwServer(500, 'Failed to create theme from manifest')
    themeId = created.id

    try {
      const statements = [
        ...manifest.filters.map(filter => db.insert(schema.themeContentFilters).values({
          themeId: created.id,
          type: filter.type,
          value: filter.value,
          matchMode: filter.match_mode,
        })),
        ...(manifest.translations ?? []).map(translation => db.insert(schema.themeTranslations).values({
          themeId: created.id,
          language: translation.language,
          name: translation.name,
          description: translation.description ?? null,
          homeCopy: translation.home_copy == null ? null : JSON.stringify(translation.home_copy),
        })),
      ]
      if (statements.length) await db.batch(statements as any)
    } catch (error) {
      await db.delete(schema.themes).where(and(eq(schema.themes.id, created.id), eq(schema.themes.slug, manifest.slug)))
      throw error
    }
  }

  if (!themeId) throwServer(500, 'Theme manifest was not applied')

  return {
    success: true,
    operation,
    data: {
      id: themeId,
      slug: manifest.slug,
      name: manifest.name,
      filters_count: manifest.filters.length,
      translations_count: (await db.select({ id: schema.themeTranslations.id })
        .from(schema.themeTranslations)
        .where(eq(schema.themeTranslations.themeId, themeId))
        .all()).length,
    },
  }
})
