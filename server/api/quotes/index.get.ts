import { transformQuotes } from '~/server/utils/quote-transformer'
import type { DatabaseQuoteWithRelations, SortBy, SortOrder } from '~/types'
import { getSortParams } from '~/server/utils/sort'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const db = hubDatabase()

    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 100) // Max 100 per page
    const status = (query.status as string) || 'approved'
    const language = query.language as string
    const authorId = query.author_id ? parseInt(query.author_id as string) : null
    const referenceId = query.reference_id ? parseInt(query.reference_id as string) : null
    const search = query.search as string

    // Normalize sort parameters (sort_by and sort_order only)
    const rawSortBy = (query.sort_by as string | undefined)?.toLowerCase()
    const rawSortOrder = (query.sort_order as string | undefined)?.toLowerCase()

    // Cast to unions for the validator; it will clamp invalid values to defaults
    const { sort_by, sort_order } = getSortParams(
      {
        sort_by: rawSortBy as typeof rawSortBy & (SortBy | undefined),
        sort_order: rawSortOrder as typeof rawSortOrder & (SortOrder | undefined)
      },
      ['created_at', 'updated_at', 'views_count', 'likes_count', 'shares_count']
    )

    // Use normalized and validated values for SQL
    const sortBy = sort_by
    const sortOrder = sort_order === 'asc' ? 'ASC' : 'DESC'

    const offset = (page - 1) * limit

    const whereConditions = ['q.status = ?']
    const params = [status]

    if (language) {
      whereConditions.push('q.language = ?')
      params.push(language)
    }

    if (authorId) {
      whereConditions.push('q.author_id = ?')
      params.push(authorId.toString())
    }

    if (referenceId) {
      whereConditions.push('q.reference_id = ?')
      params.push(referenceId.toString())
    }

    if (search) {
      whereConditions.push('q.name LIKE ?')
      params.push(`%${search}%`)
    }

    const whereClause = whereConditions.join(' AND ')


    const quotesQuery = `
      SELECT
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
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
      WHERE ${whereClause}
      GROUP BY q.id
      ORDER BY q.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `

    const countQuery = `
      SELECT COUNT(DISTINCT q.id) as total
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      WHERE ${whereClause}
    `

    const [quotesResult, countResult] = await Promise.all([
      db.prepare(quotesQuery).bind(...params, limit, offset).all(),
      db.prepare(countQuery).bind(...params).first()
    ])

    const quotes = (quotesResult.results || []) as unknown as DatabaseQuoteWithRelations[]
    const transformedQuotes = transformQuotes(quotes)

    const total = Number(countResult?.total) || 0
    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages

    return {
      success: true,
      data: transformedQuotes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore
      }
    }
  } catch (error) {
    console.error('Error fetching quotes:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch quotes'
    })
  }
})