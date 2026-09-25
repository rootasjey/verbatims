import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'
import type {
  SearchContentType,
  QuoteSearchResult,
  AuthorSearchResult,
  ReferenceSearchResult,
  ProcessedQuoteResult,
  SearchResults
} from '~~/server/types'

export default defineEventHandler(async (event): Promise<ApiResponse<SearchResults>> => {
  try {
    const query = getQuery(event)
    const searchTerm = query.q as string
    const language = query.language as QuoteLanguage | undefined
    const authorId = query.author ? parseInt(query.author as string) : null
    const referenceId = query.reference ? parseInt(query.reference as string) : null
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const requestedContentType = (query.type as SearchContentType) || 'all'

    const normalized = normalizeSearch(searchTerm)
    const hasFilters = Boolean(language || authorId || referenceId)
    if (!normalized.hasContent && !hasFilters) {
      return {
        success: true,
        data: {
          quotes: [],
          authors: [],
          references: [],
          total: 0
        }
      }
    }

    const searchPattern = normalized.likePattern
    const foldedPattern = normalized.foldedLikePattern
    const contentType: SearchContentType = !normalized.hasContent && hasFilters ? 'quotes' : requestedContentType
    const results: SearchResults = {
      quotes: [],
      authors: [],
      references: [],
      total: 0
    }

    const matchingQuoteConditions = sql`
      AND q_filter.status = 'approved'
      ${language ? sql`AND q_filter.language = ${language}` : sql``}
      ${authorId ? sql`AND qa_filter.author_id = ${authorId}` : sql``}
      ${referenceId ? sql`AND qa_filter.reference_id = ${referenceId}` : sql``}
    `

    // Search quotes if requested
    if (!contentType || contentType === 'all' || contentType === 'quotes') {
      let quotesQuery = sql`
        SELECT
          q.*,
          a.name as author_name,
          a.is_fictional as author_is_fictional,
          a.image_url as author_image_url,
          r.name as reference_name,
          r.primary_type as reference_type,
          u.name as user_name,
          GROUP_CONCAT(t.name) as tag_names,
          GROUP_CONCAT(t.color) as tag_colors,
          'quote' as result_type
        FROM ${schema.quotes} q
        LEFT JOIN ${schema.quoteAttributions} qa ON qa.quote_id = q.id AND qa.is_primary = 1
        LEFT JOIN ${schema.authors} a ON qa.author_id = a.id
        LEFT JOIN ${schema.quoteReferences} r ON qa.reference_id = r.id
        LEFT JOIN ${schema.users} u ON q.user_id = u.id
        LEFT JOIN ${schema.quoteTags} qt ON q.id = qt.quote_id
        LEFT JOIN ${schema.tags} t ON qt.tag_id = t.id
        WHERE q.status = 'approved'
        ${normalized.hasContent ? sql`AND q.id IN (SELECT rowid FROM quotes_fts WHERE name MATCH ${normalized.toMatchQuery()})` : sql``}
      `

      // Add language filter
      if (language) {
        quotesQuery = sql`${quotesQuery} AND q.language = ${language}`
      }

      // Add author filter
      if (authorId) {
        quotesQuery = sql`${quotesQuery} AND EXISTS (SELECT 1 FROM ${schema.quoteAttributions} qa_filter WHERE qa_filter.quote_id = q.id AND qa_filter.author_id = ${authorId})`
      }

      // Add reference filter
      if (referenceId) {
        quotesQuery = sql`${quotesQuery} AND EXISTS (SELECT 1 FROM ${schema.quoteAttributions} qa_filter WHERE qa_filter.quote_id = q.id AND qa_filter.reference_id = ${referenceId})`
      }

      quotesQuery = sql`${quotesQuery}
        GROUP BY q.id
        ORDER BY q.likes_count DESC, q.views_count DESC, q.created_at DESC
        LIMIT ${limit}
      `

      const quotesResult = await db.all(quotesQuery)
      const quotes = quotesResult as unknown as QuoteSearchResult[]

      results.quotes = quotes.map((quote): ProcessedQuoteResult => {
        const processed: ProcessedQuoteResult = {
          ...quote as any,
          result_type: 'quote' as const,
          tags: parseTags(quote.tag_names, quote.tag_colors)
        }
        return processed
      })
    }

    // Search authors if requested
    if (!contentType || contentType === 'all' || contentType === 'authors') {
      const authorsQuery = sql`
        SELECT
          a.*,
          'author' as result_type,
          COUNT(DISTINCT q.id) as quotes_count
        FROM ${schema.authors} a
        LEFT JOIN ${schema.quoteAttributions} qa ON a.id = qa.author_id
        LEFT JOIN ${schema.quotes} q ON q.id = qa.quote_id AND q.status = 'approved'
        WHERE (
          ${foldAccentsSQL(sql`a.name`)} LIKE ${foldedPattern}
          OR a.description LIKE ${searchPattern}
          OR a.job LIKE ${searchPattern}
        )
        ${hasFilters ? sql`AND EXISTS (
          SELECT 1
          FROM ${schema.quoteAttributions} qa_filter
          INNER JOIN ${schema.quotes} q_filter ON q_filter.id = qa_filter.quote_id
          WHERE qa_filter.author_id = a.id ${matchingQuoteConditions}
        )` : sql``}
        GROUP BY a.id
        ORDER BY a.likes_count DESC, a.views_count DESC, quotes_count DESC
        LIMIT ${limit}
      `

      const authorsResult = await db.all(authorsQuery)
      results.authors = authorsResult as unknown as AuthorSearchResult[]
    }

    // Search references if requested
    if (!contentType || contentType === 'all' || contentType === 'references') {
      const referencesQuery = sql`
        SELECT
          r.*,
          'reference' as result_type,
          COUNT(DISTINCT q.id) as quotes_count
        FROM ${schema.quoteReferences} r
        LEFT JOIN ${schema.quoteAttributions} qa ON r.id = qa.reference_id
        LEFT JOIN ${schema.quotes} q ON q.id = qa.quote_id AND q.status = 'approved'
        WHERE (
          ${foldAccentsSQL(sql`r.name`)} LIKE ${foldedPattern}
          OR r.description LIKE ${searchPattern}
          OR r.secondary_type LIKE ${searchPattern}
        )
        ${hasFilters ? sql`AND EXISTS (
          SELECT 1
          FROM ${schema.quoteAttributions} qa_filter
          INNER JOIN ${schema.quotes} q_filter ON q_filter.id = qa_filter.quote_id
          WHERE qa_filter.reference_id = r.id ${matchingQuoteConditions}
        )` : sql``}
        GROUP BY r.id
        ORDER BY r.likes_count DESC, r.views_count DESC, quotes_count DESC
        LIMIT ${limit}
      `

      const referencesResult = await db.all(referencesQuery)
      results.references = referencesResult as unknown as ReferenceSearchResult[]
    }

    // If searching all content types, limit total results and balance them
    if (!contentType || contentType === 'all') {
      const maxPerType = Math.floor(limit / 3)
      results.quotes = results.quotes.slice(0, maxPerType)
      results.authors = results.authors.slice(0, maxPerType)
      results.references = results.references.slice(0, maxPerType)

      // Fill remaining slots with quotes (most important content)
      const remaining = limit - (results.quotes.length + results.authors.length + results.references.length)
      if (remaining > 0 && results.quotes.length < limit) {
        const additionalQuotesResult = await db.all(sql`
          SELECT
            q.*,
            a.name as author_name,
            a.is_fictional as author_is_fictional,
            a.image_url as author_image_url,
            r.name as reference_name,
            r.primary_type as reference_type,
            u.name as user_name,
            GROUP_CONCAT(t.name) as tag_names,
            GROUP_CONCAT(t.color) as tag_colors,
            'quote' as result_type
          FROM ${schema.quotes} q
          LEFT JOIN ${schema.quoteAttributions} qa ON qa.quote_id = q.id AND qa.is_primary = 1
          LEFT JOIN ${schema.authors} a ON qa.author_id = a.id
          LEFT JOIN ${schema.quoteReferences} r ON qa.reference_id = r.id
          LEFT JOIN ${schema.users} u ON q.user_id = u.id
          LEFT JOIN ${schema.quoteTags} qt ON q.id = qt.quote_id
          LEFT JOIN ${schema.tags} t ON qt.tag_id = t.id
          WHERE q.status = 'approved' AND (
            EXISTS (
              SELECT 1 FROM ${schema.quoteAttributions} qa_search
              LEFT JOIN ${schema.authors} a_search ON qa_search.author_id = a_search.id
              LEFT JOIN ${schema.quoteReferences} r_search ON qa_search.reference_id = r_search.id
              WHERE qa_search.quote_id = q.id
                AND (a_search.name LIKE ${searchPattern} OR r_search.name LIKE ${searchPattern})
            ) OR
            EXISTS (SELECT 1 FROM ${schema.tags} t2 JOIN ${schema.quoteTags} qt2 ON t2.id = qt2.tag_id WHERE qt2.quote_id = q.id AND t2.name LIKE ${searchPattern})
          )
          ${language ? sql`AND q.language = ${language}` : sql``}
          ${authorId ? sql`AND EXISTS (SELECT 1 FROM ${schema.quoteAttributions} qa_filter WHERE qa_filter.quote_id = q.id AND qa_filter.author_id = ${authorId})` : sql``}
          ${referenceId ? sql`AND EXISTS (SELECT 1 FROM ${schema.quoteAttributions} qa_filter WHERE qa_filter.quote_id = q.id AND qa_filter.reference_id = ${referenceId})` : sql``}
          GROUP BY q.id
          ORDER BY q.likes_count DESC, q.views_count DESC
          LIMIT ${remaining}
        `)

        const additionalQuotes = additionalQuotesResult as unknown as QuoteSearchResult[]
        const processedAdditionalQuotes: ProcessedQuoteResult[] = additionalQuotes.map((quote): ProcessedQuoteResult => {
          const processed: ProcessedQuoteResult = {
            ...quote as any,
            result_type: 'quote' as const,
            tags: quote.tag_names ? quote.tag_names.split(',').map((name: string, index: number) => ({
              name,
              color: quote.tag_colors?.split(',')[index] || 'gray'
            })) : []
          }
          return processed
        })

        // Merge without duplicates
        const existingIds = new Set(results.quotes.map(q => q.id))
        const newQuotes = processedAdditionalQuotes.filter(q => !existingIds.has(q.id))
        results.quotes.push(...newQuotes.slice(0, remaining))
      }
    }

    // Calculate total results
    results.total = results.quotes.length + results.authors.length + results.references.length

    return {
      success: true,
      data: results
    }
  } catch (error) {
    console.error('Search error:', error)
    throwServer(500, 'Search failed')
  }
})
