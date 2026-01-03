import type {
  QuoteLanguage,
  ApiResponse,
  SearchContentType,
  QuoteSearchResult,
  AuthorSearchResult,
  ReferenceSearchResult,
  ProcessedQuoteResult,
  SearchResults
} from '~/types'
import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event): Promise<ApiResponse<SearchResults>> => {
  try {
    const query = getQuery(event)
    const searchTerm = query.q as string
    const language = query.language as QuoteLanguage | undefined
    const authorId = query.author ? parseInt(query.author as string) : null
    const referenceId = query.reference ? parseInt(query.reference as string) : null
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const contentType = (query.type as SearchContentType) || 'all'

    if (!searchTerm || searchTerm.trim().length < 2) {
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

    const searchPattern = `%${searchTerm.trim()}%`
    const results: SearchResults = {
      quotes: [],
      authors: [],
      references: [],
      total: 0
    }

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
        LEFT JOIN ${schema.authors} a ON q.author_id = a.id
        LEFT JOIN ${schema.quoteReferences} r ON q.reference_id = r.id
        LEFT JOIN ${schema.users} u ON q.user_id = u.id
        LEFT JOIN ${schema.quoteTags} qt ON q.id = qt.quote_id
        LEFT JOIN ${schema.tags} t ON qt.tag_id = t.id
        WHERE q.status = 'approved' AND q.name LIKE ${searchPattern}
      `

      // Add language filter
      if (language) {
        quotesQuery = sql`${quotesQuery} AND q.language = ${language}`
      }

      // Add author filter
      if (authorId) {
        quotesQuery = sql`${quotesQuery} AND q.author_id = ${authorId}`
      }

      // Add reference filter
      if (referenceId) {
        quotesQuery = sql`${quotesQuery} AND q.reference_id = ${referenceId}`
      }

      quotesQuery = sql`${quotesQuery}
        GROUP BY q.id
        ORDER BY q.likes_count DESC, q.views_count DESC, q.created_at DESC
        LIMIT ${limit}
      `

      const quotesResult = await db.all(quotesQuery)
      const quotes = quotesResult as unknown as QuoteSearchResult[]

      results.quotes = quotes.map((quote): ProcessedQuoteResult => ({
        ...quote,
        tags: quote.tag_names ? quote.tag_names.split(',').map((name: string, index: number) => ({
          name,
          color: quote.tag_colors?.split(',')[index] || 'gray'
        })) : []
      }))
    }

    // Search authors if requested
    if (!contentType || contentType === 'all' || contentType === 'authors') {
      const authorsQuery = sql`
        SELECT
          a.*,
          'author' as result_type,
          COUNT(q.id) as quotes_count
        FROM ${schema.authors} a
        LEFT JOIN ${schema.quotes} q ON a.id = q.author_id AND q.status = 'approved'
        WHERE a.name LIKE ${searchPattern} OR a.description LIKE ${searchPattern} OR a.job LIKE ${searchPattern}
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
          COUNT(q.id) as quotes_count
        FROM ${schema.quoteReferences} r
        LEFT JOIN ${schema.quotes} q ON r.id = q.reference_id AND q.status = 'approved'
        WHERE r.name LIKE ${searchPattern} OR r.description LIKE ${searchPattern} OR r.secondary_type LIKE ${searchPattern}
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
          LEFT JOIN ${schema.authors} a ON q.author_id = a.id
          LEFT JOIN ${schema.quoteReferences} r ON q.reference_id = r.id
          LEFT JOIN ${schema.users} u ON q.user_id = u.id
          LEFT JOIN ${schema.quoteTags} qt ON q.id = qt.quote_id
          LEFT JOIN ${schema.tags} t ON qt.tag_id = t.id
          WHERE q.status = 'approved' AND (
            a.name LIKE ${searchPattern} OR r.name LIKE ${searchPattern} OR
            EXISTS (SELECT 1 FROM ${schema.tags} t2 JOIN ${schema.quoteTags} qt2 ON t2.id = qt2.tag_id WHERE qt2.quote_id = q.id AND t2.name LIKE ${searchPattern})
          )
          GROUP BY q.id
          ORDER BY q.likes_count DESC, q.views_count DESC
          LIMIT ${remaining}
        `)

        const additionalQuotes = additionalQuotesResult as unknown as QuoteSearchResult[]
        const processedAdditionalQuotes: ProcessedQuoteResult[] = additionalQuotes.map((quote): ProcessedQuoteResult => ({
          ...quote,
          tags: quote.tag_names ? quote.tag_names.split(',').map((name: string, index: number) => ({
            name,
            color: quote.tag_colors?.split(',')[index] || 'gray'
          })) : []
        }))

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
    throw createError({
      statusCode: 500,
      statusMessage: 'Search failed'
    })
  }
})
