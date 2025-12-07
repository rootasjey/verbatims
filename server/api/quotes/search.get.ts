import { extractAuthor, extractReference, extractTags, parseIntSafe } from '~/server/utils/extraction'
import { parseSort, parseSortOrder } from '~/server/utils/sort'
import type { QuoteLanguage, ApiResponse, ProcessedQuoteResult, QuoteSearchResult } from '~/types'

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
    const db = hubDatabase()

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

    // Base select and count (share the same WHERE and tag subquery)
    let baseWhere = ` WHERE q.status = 'approved'`
    const whereParams: (string | number)[] = []

    if (hasQuery) {
      baseWhere += ' AND q.name LIKE ?'
      whereParams.push(`%${qTrim}%`)
    }

    if (language) {
      baseWhere += ' AND q.language = ?'
      whereParams.push(language)
    }
    if (authorId) {
      baseWhere += ' AND q.author_id = ?'
      whereParams.push(authorId)
    }
    if (referenceId) {
      baseWhere += ' AND q.reference_id = ?'
      whereParams.push(referenceId)
    }
    if (typeof minLen === 'number' && minLen > 0) {
      baseWhere += ' AND LENGTH(q.name) >= ?'
      whereParams.push(minLen)
    }
    if (typeof maxLen === 'number' && maxLen > 0) {
      baseWhere += ' AND LENGTH(q.name) <= ?'
      whereParams.push(maxLen)
    }
    if (from) {
      baseWhere += ' AND q.moderated_at >= ?'
      whereParams.push(from)
    }
    if (to) {
      baseWhere += ' AND q.moderated_at <= ?'
      whereParams.push(to)
    }

    // Tag filter
    let tagClause = ''
    const tagParams: (number)[] = []
    if (tagIds.length > 0) {
      tagClause = `
        AND q.id IN (
          SELECT qt3.quote_id
          FROM quote_tags qt3
          WHERE qt3.tag_id IN (${tagIds.map(() => '?').join(',')})
          GROUP BY qt3.quote_id
          HAVING COUNT(DISTINCT qt3.tag_id) = ?
        )
      `
      tagParams.push(...tagIds)
      tagParams.push(tagIds.length)
    }

    // Count query with identical filters
    const countSql = `
      SELECT COUNT(DISTINCT q.id) AS total
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN quote_tags qt ON q.id = qt.quote_id
      LEFT JOIN tags t ON qt.tag_id = t.id
      ${baseWhere}
      ${tagClause}
    `
    const countParams = [...whereParams, ...tagParams]
    const countRes = await db.prepare(countSql).bind(...countParams).first<{ total: number }>()
    const total = Number(countRes?.total || 0)

    // Data select with the same filters
    let selectSql = `
      SELECT
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
        a.image_url as author_image_url,
        r.name as reference_name,
        r.primary_type as reference_type,
        u.name as user_name,
        GROUP_CONCAT(t.name) as tag_names,
        GROUP_CONCAT(t.color) as tag_colors
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN quote_tags qt ON q.id = qt.quote_id
      LEFT JOIN tags t ON qt.tag_id = t.id
      ${baseWhere}
      ${tagClause}
    `

    const params: (string | number)[] = [...whereParams, ...tagParams]

    selectSql += '\nGROUP BY q.id\n'

    // Sorting
    if (effectiveSort === 'relevance' && hasQuery) {
      // Keep CASE priority first; apply sortOrder for subsequent fields
      selectSql += `
        ORDER BY
          CASE WHEN q.name LIKE ? THEN 0 ELSE 1 END,
          q.likes_count ${sortOrder.toUpperCase()},
          q.views_count ${sortOrder.toUpperCase()},
          q.created_at ${sortOrder.toUpperCase()}
      `
      params.push(`${qTrim}%`)
    } else if (effectiveSort === 'recent') {
      // Apply sortOrder to recency
      selectSql += `
        ORDER BY q.created_at ${sortOrder.toUpperCase()}
      `
    } else {
      // Popularity: apply sortOrder to likes/views and tiebreaker on created_at
      selectSql += `
        ORDER BY q.likes_count ${sortOrder.toUpperCase()}, q.views_count ${sortOrder.toUpperCase()}, q.created_at ${sortOrder.toUpperCase()}
      `
    }

    // Pagination
    selectSql += `
      LIMIT ?
      OFFSET ?
    `
    params.push(limit, offset)

    const result = await db.prepare(selectSql).bind(...params).all()
    const rows = (result?.results || []) as unknown as QuoteSearchResult[]

    const quotes: ProcessedQuoteResult[] = rows.map((row): ProcessedQuoteResult => {
      const author = extractAuthor(row)
      const reference = extractReference(row)
      const tags = extractTags(row)

      return ({
        ...row,
        author,
        reference,
        tags,
      })
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
