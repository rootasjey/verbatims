import { db, schema } from 'hub:db'
import { asc, desc, eq } from 'drizzle-orm'
import { buildReferenceEnrichmentPreview } from '../../../utils/enrichment/wikidata'
import { evaluateExternalCorroboration, searchMusicBrainzRecordings, searchMusicBrainzReleaseGroups, searchTvmazeShows } from '../../../utils/enrichment/sources'
import { applyCorroborationToConfidence } from '#shared/utils/enrichment-confidence'
import type { QuoteReferencePrimaryType } from '#shared/types/quote-reference'

export default defineEventHandler(async (event) => {
  await requireModerator(event)

  const body = await readBody<{ limit?: number, offset?: number, referenceId?: number, primaryType?: QuoteReferencePrimaryType }>(event)
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
      .where(body?.primaryType ? eq(schema.quoteReferences.primaryType, body.primaryType) : undefined)
      .orderBy(asc(schema.quoteReferences.description), desc(schema.quoteReferences.updatedAt), asc(schema.quoteReferences.id))
      .limit(limit)
      .offset(offset)

  const auditReference = async (reference: typeof references[number]) => {
    try {
      const preview = await buildReferenceEnrichmentPreview(reference, { audit: true, cache })
      const externalSources: Array<{ source: string, results: Awaited<ReturnType<typeof searchTvmazeShows>> }> = []
      if (reference.primaryType === 'tv_series') {
        externalSources.push({ source: 'tvmaze', results: await searchTvmazeShows(reference.name).catch(() => []) })
      }
      if (reference.primaryType === 'music') {
        const recordings = await searchMusicBrainzRecordings(reference.name).catch(() => [])
        await new Promise(resolve => setTimeout(resolve, 1000))
        const releaseGroups = await searchMusicBrainzReleaseGroups(reference.name).catch(() => [])
        externalSources.push({ source: 'musicbrainz', results: [...recordings, ...releaseGroups] })
      }
      const corroboration = evaluateExternalCorroboration(preview.match?.label, externalSources, preview.music_context, reference.releaseDate)
      const effectiveConfidence = applyCorroborationToConfidence(preview.match?.confidence, corroboration.agreementScore)
      const match = preview.match ? { ...preview.match, confidence: effectiveConfidence } : null
      const proposals = preview.proposals.map((proposal) => {
        if (corroboration.agreementScore < 20) return proposal
        const confidence = Math.min(99, proposal.confidence + 5)
        return {
          ...proposal,
          confidence,
          recommended: confidence >= (proposal.overwrite ? 90 : 78),
          source_labels: [...new Set([...proposal.source_labels, ...externalSources.map(source => source.source)])],
          rationale: `${proposal.rationale} Corroborated by ${externalSources.map(source => source.source).join(' and ')} (+5 confidence).`,
        }
      })
      const recommendedCount = proposals.filter(proposal => proposal.recommended).length
      const decision = !preview.match
        ? 'no_match'
        : effectiveConfidence === 'high'
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
        match,
        alternatives: preview.alternative_matches,
        externalSources,
        corroboration,
        musicContext: preview.music_context,
        proposals,
        decision,
        notes: preview.notes,
        summary: { ...preview.summary, recommended_count: recommendedCount },
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
