import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Delete a reference',
    description: 'Deletes a reference. Requires moderator or admin role. If the reference has related quotes, a strategy must be provided: "delete" to remove all related quotes, or "anonymize" to set their reference_id to null.',
    tags: ['References'],
    security: [{ apiKey: ['write:references'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              strategy: { type: 'string', enum: ['delete', 'anonymize'], description: 'Required when reference has related quotes' },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Reference deleted' },
      '400': { description: 'Strategy required when quotes exist' },
      '403': { description: 'Insufficient role' },
      '404': { description: 'Reference not found' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'write:references')
  requireApiKeyRole(api, 'admin', 'moderator')

  const refId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(refId)) throwServer(400, 'Invalid reference ID')

  const existing = await db.select()
    .from(schema.quoteReferences)
    .where(eq(schema.quoteReferences.id, refId))
    .get()

  if (!existing) throwServer(404, 'Reference not found')

  if (existing.imageUrl && isR2ImageUrl(existing.imageUrl)) {
    await deleteImageByUrl(existing.imageUrl)
  }

  const body = await readBody(event).catch(() => ({})) as { strategy?: 'delete' | 'anonymize' }

  const quoteCountResult = await db.get<{ count: number }>(sql`
    SELECT COUNT(*) as count FROM ${schema.quotes} WHERE reference_id = ${refId}
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
          .where(eq(schema.quotes.referenceId, refId))
          .run()
      } else {
        await db.update(schema.quotes)
          .set({ referenceId: null })
          .where(eq(schema.quotes.referenceId, refId))
          .run()
      }

      await db.delete(schema.quoteReferences)
        .where(eq(schema.quoteReferences.id, refId))
        .run()

      await db.run(sql`COMMIT`)
    } catch {
      await db.run(sql`ROLLBACK`)
      throwServer(500, 'Failed to process deletion transaction')
    }

    return { success: true, message: 'Reference deleted successfully', data: { quotesAffected: quoteCount, strategy: body.strategy } }
  }

  await db.delete(schema.quoteReferences)
    .where(eq(schema.quoteReferences.id, refId))
    .run()

  return { success: true, message: 'Reference deleted successfully', data: { quotesAffected: 0 } }
})
