import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireQuote } from '~~/server/utils/admin-quote-provenance'

export default defineEventHandler(async (event) => {
  await requireModerator(event)
  const quoteId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(quoteId) || quoteId <= 0) throwServer(400, 'Invalid quote ID')
  await requireQuote(quoteId)

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
