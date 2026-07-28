import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Add a tag to a quote',
    description: 'Attaches a tag to a quote. Accept either tag ID or tag name (creates new tag if admin).',
    tags: ['Quotes'],
    security: [{ apiKey: ['write:quotes'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
            schema: {
            type: 'object',
            properties: {
              tagId: { type: 'integer', description: 'Existing tag ID' },
              name: { type: 'string', description: 'Tag name (case-insensitive, creates new tag if admin)' },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Tag added' },
      '400': { description: 'Validation error' },
      '403': { description: 'Not allowed' },
      '404': { description: 'Quote or tag not found' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'user', 'moderator', 'admin')
  requireApiPermission(api, 'write:quotes')

  const quoteId = getRouterParam(event, 'id')!
  if (!quoteId || isNaN(parseInt(quoteId))) {
    throwServer(400, 'Invalid quote ID')
  }

  const body = await readBody(event)
  const { tagId, name } = body || {}
  if (!tagId && !name) {
    throwServer(400, 'Provide tagId or name')
  }

  const quote = await db.select({
    userId: schema.quotes.userId,
    status: schema.quotes.status,
  })
    .from(schema.quotes)
    .where(eq(schema.quotes.id, parseInt(quoteId)))
    .get()

  if (!quote) throwServer(404, 'Quote not found')

  const isPrivileged = api.role === 'admin' || api.role === 'moderator'
  const isAdminUser = api.role === 'admin'
  const isOwnerDraft = quote.userId === api.userId && quote.status === 'draft'
  if (!isPrivileged && !isOwnerDraft) {
    throwServer(403, 'Not allowed to edit tags for this quote')
  }

  let finalTagId = tagId

  if (!finalTagId) {
    const existing = await db.select({
      id: schema.tags.id,
      name: schema.tags.name,
    })
      .from(schema.tags)
      .where(sql`LOWER(${schema.tags.name}) = LOWER(${String(name).trim()})`)
      .get()

    if (!existing && isAdminUser) {
      const inserted = await db.insert(schema.tags).values({
        name: String(name).trim(),
        color: '#687FE5',
      }).returning({ id: schema.tags.id }).get()
      finalTagId = inserted.id
    } else if (!existing) {
      throwServer(400, 'Only admins can create new tags. Please use an existing tag ID.')
    } else {
      finalTagId = existing.id
    }
  }

  const tag = await db.select({ id: schema.tags.id, name: schema.tags.name })
    .from(schema.tags)
    .where(eq(schema.tags.id, finalTagId))
    .get()

  if (!tag) throwServer(404, 'Tag not found')

  await db.insert(schema.quoteTags).values({
    quoteId: parseInt(quoteId),
    tagId: finalTagId,
  }).onConflictDoNothing().run()

  return {
    success: true,
    data: { id: tag.id, name: tag.name },
  }
})
