import { extractAuthor, extractReference, extractTags, parseIntSafe } from '~/server/utils/extraction'
import { parseSort, parseSortOrder } from '~/server/utils/sort'
import type { QuoteLanguage, ApiResponse, ProcessedQuoteResult, QuoteSearchResult } from '~/types'
import { db, schema } from 'hub:db'
import { eq, and, like, gte, lte, inArray, sql, desc, asc, count } from 'drizzle-orm'

export default defineEventHandler(async (event): Promise<ApiResponse<{
  quotes: ProcessedQuoteResult[]
  total: number
  page: number
  limit: number
  offset: number
  pageCount: number
  sort: 'relevance' | 'recent' | 'popular'
  q?: string
  filters: {
    language?: QuoteLanguage
    author?: number | null
    reference?: number | null
    tagIds?: number[]
    minLen?: number
    maxLen?: number
    from?: string
    to?: string
  }
}>> => {
  try {
    const query = getQuery(event)

    const q = (query.q as string | undefined) || ''
    const qTrim = q.trim()
    const hasQuery = qTrim.length >= 2

    const language = query.language as QuoteLanguage | undefined
    const authorId = query.author ? parseIntSafe(query.author, 0) || null : null
    const referenceId = query.reference ? parseIntSafe(query.reference, 0) || null : null

    // tags can be a list of IDs: "1,2,3"
    const tagIds = typeof query.tags === 'string'
      ? (query.tags as string)
          .split(',')
          .map(s => parseIntSafe(s, NaN))
          .filter(n => Number.isFinite(n)) as number[]
      : []

    const minLen = query.minLen ? parseIntSafe(query.minLen, 0) : undefined
    const maxLen = query.maxLen ? parseIntSafe(query.maxLen, 0) : undefined
    const from = typeof query.from === 'string' && query.from ? query.from : undefined
    const to = typeof query.to === 'string' && query.to ? query.to : undefined

    const limit = Math.min(parseIntSafe(query.limit, 20), 100)
    const page = Math.max(parseIntSafe(query.page, 1), 1)
    const offset = query.offset ? Math.max(parseIntSafe(query.offset, (page - 1) * limit), 0) : (page - 1) * limit

    const sort = parseSort(query.sort)
    const sortOrder = parseSortOrder(query.sortOrder)
    const effectiveSort: 'relevance' | 'recent' | 'popular' = hasQuery ? sort : (sort === 'relevance' ? 'recent' : sort)

    const filters = {
      language,
      author: authorId,
      reference: referenceId,
      tagIds,
      minLen,
      maxLen,
      from,
      to,
    }

    // Build conditions
    const conditions = [eq(schema.quotes.status, 'approved')]

    if (hasQuery) {
      conditions.push(like(schema.quotes.name, `%${qTrim}%`))
    }

    if (language) {
      conditions.push(eq(schema.quotes.originalLanguage, language))
    }
    if (authorId) {
      conditions.push(eq(schema.quotes.authorId, authorId))
    }
    if (referenceId) {
      conditions.push(eq(schema.quotes.referenceId, referenceId))
    }
    if (typeof minLen === 'number' && minLen > 0) {
      conditions.push(sql`LENGTH(${schema.quotes.name}) >= ${minLen}`)
    }
    if (typeof maxLen === 'number' && maxLen > 0) {
      conditions.push(sql`LENGTH(${schema.quotes.name}) <= ${maxLen}`)
    }
    if (from) {
      conditions.push(gte(schema.quotes.moderatedAt, new Date(from)))
    }
    if (to) {
      conditions.push(lte(schema.quotes.moderatedAt, new Date(to)))
    }

    // Tag filter
    if (tagIds.length > 0) {
      const subQuery = db.select({ quoteId: schema.quotesTags.quoteId })
        .from(schema.quotesTags)
        .where(inArray(schema.quotesTags.tagId, tagIds))
        .groupBy(schema.quotesTags.quoteId)
        .having(sql`COUNT(DISTINCT ${schema.quotesTags.tagId}) = ${tagIds.length}`)
      
      conditions.push(inArray(schema.quotes.id, subQuery))
    }

    // Count query
    const countRes = await db.select({ total: count(schema.quotes.id) })
      .from(schema.quotes)
      .where(and(...conditions))
      .get()
    
    const total = countRes?.total || 0

    // Sorting
    const orderBy = []
    if (effectiveSort === 'relevance' && hasQuery) {
      // Keep CASE priority first; apply sortOrder for subsequent fields
      orderBy.push(sql`CASE WHEN ${schema.quotes.name} LIKE ${qTrim + '%'} THEN 0 ELSE 1 END`)
      orderBy.push(sortOrder === 'asc' ? asc(schema.quotes.likesCount) : desc(schema.quotes.likesCount))
      orderBy.push(sortOrder === 'asc' ? asc(schema.quotes.viewsCount) : desc(schema.quotes.viewsCount))
      orderBy.push(sortOrder === 'asc' ? asc(schema.quotes.createdAt) : desc(schema.quotes.createdAt))
    } else if (effectiveSort === 'recent') {
      // Apply sortOrder to recency
      orderBy.push(sortOrder === 'asc' ? asc(schema.quotes.createdAt) : desc(schema.quotes.createdAt))
    } else {
      // Popularity: apply sortOrder to likes/views and tiebreaker on created_at
      orderBy.push(sortOrder === 'asc' ? asc(schema.quotes.likesCount) : desc(schema.quotes.likesCount))
      orderBy.push(sortOrder === 'asc' ? asc(schema.quotes.viewsCount) : desc(schema.quotes.viewsCount))
      orderBy.push(sortOrder === 'asc' ? asc(schema.quotes.createdAt) : desc(schema.quotes.createdAt))
    }

    // Data select
    const rows = await db.select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      originalLanguage: schema.quotes.originalLanguage,
      status: schema.quotes.status,
      viewsCount: schema.quotes.viewsCount,
      likesCount: schema.quotes.likesCount,
      sharesCount: schema.quotes.sharesCount,
      isFeatured: schema.quotes.isFeatured,
      createdAt: schema.quotes.createdAt,
      updatedAt: schema.quotes.updatedAt,
      authorId: schema.quotes.authorId,
      referenceId: schema.quotes.referenceId,
      userId: schema.quotes.userId,
      authorName: schema.authors.name,
      authorIsFictional: schema.authors.isFictional,
      authorImageUrl: schema.authors.imageUrl,
      referenceName: schema.quoteReferences.name,
      referenceType: schema.quoteReferences.primaryType,
      userName: schema.users.name,
      tagNames: sql<string>`GROUP_CONCAT(${schema.tags.name})`,
      tagColors: sql<string>`GROUP_CONCAT(${schema.tags.color})`
    })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
    .leftJoin(schema.quotesTags, eq(schema.quotes.id, schema.quotesTags.quoteId))
    .leftJoin(schema.tags, eq(schema.quotesTags.tagId, schema.tags.id))
    .where(and(...conditions))
    .groupBy(schema.quotes.id)
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset)
    .all()

    const quotes: ProcessedQuoteResult[] = rows.map((row): ProcessedQuoteResult => {
      // Map Drizzle result to the structure expected by extract functions
      // The extract functions expect snake_case properties from raw SQL
      // We need to adapt or rewrite the extract functions.
      // Since I cannot rewrite extract functions easily without seeing them, 
      // I will construct the object manually here to match ProcessedQuoteResult
      
      const tags = row.tagNames ? row.tagNames.split(',').map((name: string, index: number) => ({
        name,
        color: row.tagColors?.split(',')[index]
      })) : []

      return {
        id: row.id,
        name: row.name,
        language: row.originalLanguage,
        status: row.status,
        views_count: row.viewsCount,
        likes_count: row.likesCount,
        shares_count: row.sharesCount,
        is_featured: row.isFeatured,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
        author: row.authorId ? {
          id: row.authorId,
          name: row.authorName,
          is_fictional: row.authorIsFictional,
          image_url: row.authorImageUrl
        } : undefined,
        reference: row.referenceId ? {
          id: row.referenceId,
          name: row.referenceName,
          primary_type: row.referenceType
        } : undefined,
        user: {
          id: row.userId,
          name: row.userName
        },
        tags
      } as unknown as ProcessedQuoteResult
    })

    const response = {
      quotes,
      total,
      page,
      limit,
      offset,
      sort: effectiveSort,
      q: hasQuery ? qTrim : undefined,
      filters,
      hasMore: offset + quotes.length < total
    }

    // Modest caching for identical queries
    setResponseHeader(event, 'Cache-Control', 'public, max-age=30')

    // Attach derived pageCount before returning
    const payload = {
      ...response,
      pageCount: Math.max(1, Math.ceil(total / Math.max(1, limit)))
    }

    return {
      success: true,
      data: payload
    }
  } catch (error) {
    console.error('Quotes search error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to search quotes'
    })
  }
})
