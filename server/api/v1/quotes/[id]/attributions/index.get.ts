import { db, schema } from 'hub:db'
import { requireApiPermission } from '~~/server/utils/api-key'
import { requireApiQuoteReadAccess } from '~~/server/utils/api-quote-provenance'
import { eq } from 'drizzle-orm'

defineRouteMeta({ openAPI: { summary: 'List quote attributions', tags: ['Quote provenance'], security: [{ apiKey: ['read:provenance'] }] } })

export default defineEventHandler(async (event) => {
  requireApiPermission(event.context.api, 'read:provenance')
  const quoteId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(quoteId) || quoteId <= 0) throwServer(400, 'Invalid quote ID')
  await requireApiQuoteReadAccess(event.context.api, quoteId)

  const data = await db.select({
    id: schema.quoteAttributions.id,
    quote_id: schema.quoteAttributions.quoteId,
    author_id: schema.quoteAttributions.authorId,
    reference_id: schema.quoteAttributions.referenceId,
    is_primary: schema.quoteAttributions.isPrimary,
    status: schema.quoteAttributions.status,
    verified_by: schema.quoteAttributions.verifiedBy,
    verified_at: schema.quoteAttributions.verifiedAt,
    notes: schema.quoteAttributions.notes,
    author_name: schema.authors.name,
    reference_name: schema.quoteReferences.name,
  })
    .from(schema.quoteAttributions)
    .leftJoin(schema.authors, eq(schema.quoteAttributions.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quoteAttributions.referenceId, schema.quoteReferences.id))
    .where(eq(schema.quoteAttributions.quoteId, quoteId))
    .all()

  return { success: true, data }
})
