import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Create a theme',
    description: 'Creates a new content theme.',
    tags: ['Themes'],
    security: [{ apiKey: ['admin:themes'] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['slug', 'name'],
            properties: {
              slug: { type: 'string', description: 'Unique URL-friendly identifier' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              language: { type: 'string', nullable: true },
              is_active: { type: 'boolean', default: false },
              is_default: { type: 'boolean', default: false },
              priority: { type: 'integer', default: 0 },
              scheduled_start: { type: 'string', nullable: true },
              scheduled_end: { type: 'string', nullable: true },
              config: { type: 'object', nullable: true },
              translations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    language: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    responses: {
      '201': { description: 'Theme created' },
      '409': { description: 'Theme slug already exists' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'moderator', 'admin')
  requireApiPermission(api, 'admin:themes')

  const body = await readBody(event)
  const slug = String(body?.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const name = String(body?.name || '').trim()
  const description = body?.description || null
  const language = body?.language || null
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

  const sStart = scheduledStart ? new Date(scheduledStart).getTime() : 'NULL'
  const sEnd = scheduledEnd ? new Date(scheduledEnd).getTime() : 'NULL'
  const langVal = language ? `'${language.replace(/'/g, "''")}'` : 'NULL'
  const descVal = description ? `'${description.replace(/'/g, "''")}'` : 'NULL'
  await db.run(sql.raw(
    `INSERT INTO themes (slug, name, description, language, config, is_active, is_default, scheduled_start, scheduled_end, priority) VALUES ('${slug}', '${name.replace(/'/g, "''")}', ${descVal}, ${langVal}, '${config.replace(/'/g, "''")}', ${isActive ? 1 : 0}, ${isDefault ? 1 : 0}, ${sStart}, ${sEnd}, ${priority})`
  ))

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
      translations.map((t: { language: string; name: string; description?: string | null }) => ({
        themeId: theme.id,
        language: t.language,
        name: t.name,
        description: t.description || null,
      }))
    )
  }

  return { success: true, data: theme }
})
