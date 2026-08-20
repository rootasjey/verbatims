import { db, schema } from 'hub:db'
import { asc, desc, eq } from 'drizzle-orm'
import { buildReferenceEnrichmentPreview } from '../../../utils/enrichment/wikidata'

export default defineEventHandler(async (event) => {
  await requireModerator(event)

  const body = await readBody<{ limit?: number, offset?: number, referenceId?: number }>(event)
  const requestedLimit = Number(body?.limit)
  const requestedOffset = Number(body?.offset)
  const limit = Math.max(1, Math.min(Number.isInteger(requestedLimit) ? requestedLimit : 10, 50))
  const offset = Math.max(0, Number.isInteger(requestedOffset) ? requestedOffset : 0)
  const requestedReferenceId = Number(body?.referenceId)

  const references = Number.isInteger(requestedReferenceId) && requestedReferenceId > 0
    ? await db.select()
      .from(schema.quoteReferences)
      .where(eq(schema.quoteReferences.id, requestedReferenceId))
      .limit(1)
    : await db.select()
      .from(schema.quoteReferences)
      .orderBy(asc(schema.quoteReferences.description), desc(schema.quoteReferences.updatedAt), asc(schema.quoteReferences.id))
      .limit(limit)
      .offset(offset)

  const auditReference = async (reference: typeof references[number]) => {
    try {
      const preview = await buildReferenceEnrichmentPreview(reference, { audit: true, cache })
      const decision = !preview.match
        ? 'no_match'
        : preview.match.confidence === 'high'
          ? 'accepted'
          : 'ambiguous_match'
      return {
        referenceId: reference.id,
        referenceName: reference.name,
        current: {
          primaryType: reference.primaryType,
          hasDescription: Boolean(reference.description?.trim()),
          hasReleaseDate: Boolean(reference.releaseDate?.trim()),
          hasImage: Boolean(reference.imageUrl?.trim()),
          hasUrls: Boolean(reference.urls && reference.urls !== '[]'),
        },
        match: preview.match,
        alternatives: preview.alternative_matches,
        proposals: preview.proposals,
        decision,
        notes: preview.notes,
        summary: preview.summary,
      }
    } catch (error) {
      return {
        referenceId: reference.id,
        referenceName: reference.name,
        error: error instanceof Error ? error.message : 'Unknown audit error',
      }
    }
  }

  const cache = new Map<string, Promise<unknown>>()
  const results = []
  const concurrency = 3
  for (let index = 0; index < references.length; index += concurrency) {
    const batch = references.slice(index, index + concurrency)
    results.push(...await Promise.all(batch.map(auditReference)))
  }

  return {
    success: true,
    data: {
      readOnly: true,
      entityType: 'reference',
      count: results.length,
      results,
    },
  }
})
