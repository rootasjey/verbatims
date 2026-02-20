import { db, schema } from 'hub:db'
import { eq, inArray } from 'drizzle-orm'
import { ensureCuratedTagsExist, matchCuratedTagsForQuote } from '~~/server/utils/tagging'

type QuoteStatus = 'draft' | 'pending' | 'approved' | 'rejected'

const toChunks = <T>(items: T[], size: number) => {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
    }

    const body = await readBody(event)
    const dryRun = body?.dryRun !== false
    const status = (body?.status as QuoteStatus | 'all' | undefined) || 'approved'
    const onlyUntagged = Boolean(body?.onlyUntagged)
    const resetExisting = Boolean(body?.resetExisting)
    const limit = Math.min(Math.max(parseInt(String(body?.limit || '2000')) || 2000, 1), 5000)
    const quoteIds = Array.isArray(body?.quoteIds)
      ? body.quoteIds.map((value: unknown) => parseInt(String(value))).filter((value: number) => !isNaN(value))
      : []

    const allowedStatuses: Array<QuoteStatus | 'all'> = ['all', 'draft', 'pending', 'approved', 'rejected']
    if (!allowedStatuses.includes(status)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid status filter' })
    }

    const { created, idsByLowerName } = await ensureCuratedTagsExist()

    let quotesQuery = db.select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      language: schema.quotes.language,
      status: schema.quotes.status
    }).from(schema.quotes).$dynamic().limit(limit)

    if (quoteIds.length > 0) {
      quotesQuery = quotesQuery.where(inArray(schema.quotes.id, quoteIds))
    } else if (status !== 'all') {
      quotesQuery = quotesQuery.where(eq(schema.quotes.status, status))
    }

    let quotes = await quotesQuery

    if (onlyUntagged) {
      const taggedQuoteRows = await db.select({ quoteId: schema.quoteTags.quoteId })
        .from(schema.quoteTags)
      const taggedQuoteIds = new Set(taggedQuoteRows.map(row => row.quoteId))
      quotes = quotes.filter(quote => !taggedQuoteIds.has(quote.id))
    }

    if (!quotes.length) {
      return {
        success: true,
        dryRun,
        message: 'No quotes matched the backfill filters',
        results: {
          quotes_scanned: 0,
          quotes_with_matches: 0,
          links_attempted: 0,
          curated_tags_created: created.length,
          curated_tags_created_names: created
        }
      }
    }

    const matches = quotes.map(quote => {
      const matchedNames = matchCuratedTagsForQuote(quote.name, quote.language || undefined)
      const matchedTagIds = matchedNames
        .map(name => idsByLowerName.get(name.toLowerCase()))
        .filter((value): value is number => typeof value === 'number')

      return {
        quoteId: quote.id,
        status: quote.status,
        matchedNames,
        matchedTagIds
      }
    })

    const matchedQuotes = matches.filter(entry => entry.matchedTagIds.length > 0)

    let linksAttempted = 0
    if (!dryRun) {
      if (resetExisting) {
        const selectedQuoteIds = quotes.map(quote => quote.id)
        for (const chunk of toChunks(selectedQuoteIds, 300)) {
          await db.delete(schema.quoteTags)
            .where(inArray(schema.quoteTags.quoteId, chunk))
            .run()
        }
      }

      for (const entry of matchedQuotes) {
        await db.insert(schema.quoteTags)
          .values(entry.matchedTagIds.map(tagId => ({ quoteId: entry.quoteId, tagId })))
          .onConflictDoNothing()
          .run()

        linksAttempted += entry.matchedTagIds.length
      }
    }

    return {
      success: true,
      dryRun,
      message: dryRun ? 'Backfill dry-run completed' : 'Backfill applied successfully',
      filters: {
        status,
        limit,
        onlyUntagged,
        resetExisting,
        quoteIdsCount: quoteIds.length
      },
      results: {
        quotes_scanned: quotes.length,
        quotes_with_matches: matchedQuotes.length,
        links_attempted: linksAttempted,
        curated_tags_created: created.length,
        curated_tags_created_names: created,
        preview: matchedQuotes.slice(0, 40).map(item => ({
          quote_id: item.quoteId,
          matched_tags: item.matchedNames
        }))
      }
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }

    console.error('Backfill tags error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to backfill tags' })
  }
})