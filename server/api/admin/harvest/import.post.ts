import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { isHarvestSourceType } from '#shared/constants/harvest'
import type { HarvestQuoteImportItem } from '#shared/types/harvest'
import { findOrCreateAuthor, findOrCreateReference } from '../../../utils/import-helpers'

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) throwServer(401, 'Authentication required')
  if (user?.role !== 'admin') {
    throwServer(403, 'Admin access required')
  }

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

  for (const quoteData of quotes) {
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
      if (!authorId && quoteData.new_author) {
        const result = await findOrCreateAuthor({
          name: quoteData.new_author.name,
          job: quoteData.new_author.job,
          description: quoteData.new_author.description,
          birth_date: quoteData.new_author.birth_date,
          death_date: quoteData.new_author.death_date,
          image_url: quoteData.new_author.image_url,
          is_fictional: quoteData.new_author.is_fictional || false,
        })
        authorId = result.id
        if (result.isNew) authorsCreated++
      }

      let referenceId: number | null = quoteData.reference_id || null
      if (!referenceId && quoteData.new_reference) {
        const result = await findOrCreateReference({
          name: quoteData.new_reference.name,
          primary_type: quoteData.new_reference.primary_type,
          original_language: quoteData.new_reference.original_language,
          description: quoteData.new_reference.description,
        })
        referenceId = result.id
        if (result.isNew) referencesCreated++
      }

      const userId = user.id

      await db.insert(schema.quotes).values({
        name: trimmedText,
        language: quoteData.language || 'en',
        authorId,
        referenceId,
        userId,
        status: 'harvested',
        sourceType: sourceType,
        sourceUrl: quoteData.sourceUrl || null,
      })

      imported++
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