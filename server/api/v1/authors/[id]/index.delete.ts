import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Delete an author',
    description: 'Deletes an author. Requires moderator or admin role. If the author has related quotes, a strategy must be provided: "delete" to remove all related quotes, or "anonymize" to set their author_id to null.',
    tags: ['Authors'],
    security: [{ apiKey: ['write:authors'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              strategy: { type: 'string', enum: ['delete', 'anonymize'], description: 'Required when author has related quotes' },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Author deleted' },
      '400': { description: 'Strategy required when quotes exist' },
      '403': { description: 'Insufficient role' },
      '404': { description: 'Author not found' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'write:authors')
  requireApiKeyRole(api, 'admin', 'moderator')

  const authorId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(authorId)) throwServer(400, 'Invalid author ID')

  const existing = await db.select()
    .from(schema.authors)
    .where(eq(schema.authors.id, authorId))
    .get()

  if (!existing) throwServer(404, 'Author not found')

  if (existing.imageUrl && isR2ImageUrl(existing.imageUrl)) {
    await deleteImageByUrl(existing.imageUrl)
  }

  const body = await readBody(event).catch(() => ({})) as { strategy?: 'delete' | 'anonymize' }

  const quoteCountResult = await db.get<{ count: number }>(sql`
    SELECT COUNT(*) as count FROM ${schema.quotes} WHERE author_id = ${authorId}
  `)
  const quoteCount = quoteCountResult?.count || 0

  if (quoteCount > 0) {
    const strategy = body?.strategy
    if (strategy !== 'delete' && strategy !== 'anonymize') {
      throwServer(400, 'Related quotes exist. Provide strategy: "delete" or "anonymize".')
    }

    await db.run(sql`BEGIN TRANSACTION`)
    try {
      if (strategy === 'delete') {
        await db.delete(schema.quotes)
          .where(eq(schema.quotes.authorId, authorId))
          .run()
      } else {
        await db.update(schema.quotes)
          .set({ authorId: null })
          .where(eq(schema.quotes.authorId, authorId))
          .run()
      }

      await db.delete(schema.authors)
        .where(eq(schema.authors.id, authorId))
        .run()

      await db.run(sql`COMMIT`)
    } catch {
      await db.run(sql`ROLLBACK`)
      throwServer(500, 'Failed to process deletion transaction')
    }

    return { success: true, message: 'Author deleted successfully', data: { quotesAffected: quoteCount, strategy: body.strategy } }
  }

  await db.delete(schema.authors)
    .where(eq(schema.authors.id, authorId))
    .run()

  return { success: true, message: 'Author deleted successfully', data: { quotesAffected: 0 } }
})
