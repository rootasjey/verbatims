import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { isHarvestSourceType } from '#shared/constants/harvest'
import type { HarvestQuoteImportItem } from '#shared/types/harvest'
import { runWebEditorialAuditedBatch } from '~~/server/utils/api-editorial-audit'
import { buildQuoteCreationStatements, hashQuoteCreationPayload, scopeQuoteCreationRequestKey, type QuoteCreationBatchInput } from '~~/server/utils/quote-creation'

export default defineEventHandler(async (event) => {
  const { user } = await requireAdmin(event)

  const body = await readBody(event)
  const { sourceType, quotes } = body as {
    sourceType: string
    quotes: HarvestQuoteImportItem[]
  }

  if (!isHarvestSourceType(sourceType)) {
    throwServer(400, `Invalid source type: ${sourceType}`)
  }

  if (!Array.isArray(quotes) || quotes.length === 0) {
    throwServer(400, 'Quotes array is required and must not be empty')
  }

  if (quotes.length > 100) {
    throwServer(400, 'Maximum 100 quotes can be imported at once')
  }

  let imported = 0
  let skipped = 0
  let authorsCreated = 0
  let referencesCreated = 0
  const errors: string[] = []

  const logResult = await db.insert(schema.harvestLogs).values({
    sourceId: null,
    userId: user.id,
    status: 'processing',
    sourceType: sourceType,
    sourcePageSlug: quotes[0]?.sourceUrl?.split('/').pop() || null,
    sourcePageUrl: quotes[0]?.sourceUrl || null,
    quotesFound: quotes.length,
    quotesImported: 0,
    quotesSkipped: 0,
    authorsCreated: 0,
    referencesCreated: 0,
    startedAt: new Date(),
  }).returning({ id: schema.harvestLogs.id }).get()

  const logId = logResult?.id
  if (!logId) throwServer(500, 'Failed to create harvest log')

  for (const [index, quoteData] of quotes.entries()) {
    try {
      const trimmedText = (quoteData.text || '').trim()
      if (trimmedText.length < 2 || trimmedText.length > 4000) {
        skipped++
        errors.push(`Quote skipped: text length must be 2-4000 chars (got ${trimmedText.length})`)
        continue
      }

      const normalizedText = trimmedText.toLowerCase()
      const existing = await db.select({ id: schema.quotes.id, status: schema.quotes.status })
        .from(schema.quotes)
        .where(sql`LOWER(TRIM(${schema.quotes.name})) = ${normalizedText}`)
        .limit(1)
        .get()

      if (existing && existing.status !== 'rejected') {
        skipped++
        continue
      }

      let authorId: number | null = quoteData.author_id || null
      let newAuthor: QuoteCreationBatchInput['newAuthor']
      if (!authorId && quoteData.new_author) {
        const authorName = quoteData.new_author.name.trim()
        if (!authorName) throw new Error('Author name is required')
        const existingAuthor = await db.select({ id: schema.authors.id })
          .from(schema.authors)
          .where(sql`LOWER(${schema.authors.name}) = LOWER(${authorName})`)
          .limit(1)
          .get()
        if (existingAuthor) {
          authorId = existingAuthor.id
        } else {
          newAuthor = {
            name: authorName,
            isFictional: quoteData.new_author.is_fictional || false,
            job: quoteData.new_author.job,
            description: quoteData.new_author.description,
            birth_date: quoteData.new_author.birth_date,
            birth_year: quoteData.new_author.birth_year,
            birth_era: quoteData.new_author.birth_era,
            birth_month: quoteData.new_author.birth_month,
            birth_day: quoteData.new_author.birth_day,
            birth_is_approximate: quoteData.new_author.birth_is_approximate,
            birth_calendar: quoteData.new_author.birth_calendar,
            birth_location: quoteData.new_author.birth_location,
            death_date: quoteData.new_author.death_date,
            death_year: quoteData.new_author.death_year,
            death_era: quoteData.new_author.death_era,
            death_month: quoteData.new_author.death_month,
            death_day: quoteData.new_author.death_day,
            death_is_approximate: quoteData.new_author.death_is_approximate,
            death_calendar: quoteData.new_author.death_calendar,
            death_location: quoteData.new_author.death_location,
            image_url: quoteData.new_author.image_url,
          }
        }
      }

      let referenceId: number | null = quoteData.reference_id || null
      let newReference: QuoteCreationBatchInput['newReference']
      if (!referenceId && quoteData.new_reference) {
        const referenceName = quoteData.new_reference.name.trim()
        if (!referenceName) throw new Error('Reference name is required')
        const existingReference = await db.select({ id: schema.quoteReferences.id })
          .from(schema.quoteReferences)
          .where(sql`LOWER(${schema.quoteReferences.name}) = LOWER(${referenceName})`)
          .limit(1)
          .get()
        if (existingReference) {
          referenceId = existingReference.id
        } else {
          newReference = {
            name: referenceName,
            originalLanguage: quoteData.new_reference.original_language,
            primaryType: quoteData.new_reference.primary_type,
            description: quoteData.new_reference.description,
          }
        }
      }

      const userId = user.id

      if (authorId == null && referenceId == null) {
        skipped++
        errors.push('Quote skipped: an author or reference is required')
        continue
      }

      const requestKey = scopeQuoteCreationRequestKey(`harvest:${logId}:${index}`, userId)
      const payloadHash = await hashQuoteCreationPayload(quoteData)
      const { statements } = buildQuoteCreationStatements({
        requestKey,
        userId,
        payloadHash,
        quote: { name: trimmedText, language: quoteData.language || 'en', status: 'harvested' },
        authorId,
        referenceId,
        newAuthor,
        newReference,
        primaryAttribution: { status: 'unverified' },
        sources: [{ source_type: sourceType, source_url: quoteData.sourceUrl || null }],
        sourcesArePrimary: true,
        retainIdempotencyRecord: false,
      })
      await runWebEditorialAuditedBatch(event, userId, statements, 'admin_harvest')

      imported++
      if (newAuthor) authorsCreated++
      if (newReference) referencesCreated++
    } catch (error: any) {
      skipped++
      errors.push(`Failed to import quote: ${error?.message || 'Unknown error'}`)
    }
  }

  await db.update(schema.harvestLogs)
    .set({
      status: imported > 0 ? 'completed' : 'failed',
      quotesImported: imported,
      quotesSkipped: skipped,
      authorsCreated,
      referencesCreated,
      errorMessage: errors.length > 0 ? errors.join('\n') : null,
      completedAt: new Date(),
    })
    .where(eq(schema.harvestLogs.id, logId!))
    .execute()

  return {
    success: true,
    data: {
      totalQuotes: quotes.length,
      imported,
      skipped,
      authorsCreated,
      referencesCreated,
      errors: errors.length > 0 ? errors : undefined,
    },
  }
})
