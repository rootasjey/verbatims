import { db, schema } from 'hub:db'
import { eq, and, like, desc, asc, sql, countDistinct, getTableColumns } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)

    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 100) // Max 100 per page
    const status = (query.status as string) || 'approved'
    const language = query.language as string
    const authorId = query.author_id ? parseInt(query.author_id as string) : null
    const referenceId = query.reference_id ? parseInt(query.reference_id as string) : null
    const search = query.search as string
    const tag = query.tag as string | undefined

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
    const sortOrder = sort_order === 'asc' ? asc : desc

    const offset = (page - 1) * limit

    const conditions = [eq(schema.quotes.status, status as any)]
    if (language) conditions.push(eq(schema.quotes.language, language as any))
    if (authorId) conditions.push(eq(schema.quotes.authorId, authorId))
    if (referenceId) conditions.push(eq(schema.quotes.referenceId, referenceId))
    if (search) conditions.push(like(schema.quotes.name, `%${search}%`))
    if (tag?.trim()) {
      conditions.push(sql`EXISTS (
        SELECT 1
        FROM ${schema.quoteTags} qt2
        INNER JOIN ${schema.tags} t2 ON qt2.tag_id = t2.id
        WHERE qt2.quote_id = ${schema.quotes.id}
          AND LOWER(t2.name) = LOWER(${tag.trim()})
      )`)
    }

    const quotesQuery = db.select({
        ...getTableColumns(schema.quotes),
        author_name: schema.authors.name,
        author_is_fictional: schema.authors.isFictional,
        reference_name: schema.quoteReferences.name,
        reference_type: schema.quoteReferences.primaryType,
        user_name: schema.users.name,
        tag_names: sql`GROUP_CONCAT(${schema.tags.name})`,
        tag_colors: sql`GROUP_CONCAT(${schema.tags.color})`
      })
      .from(schema.quotes)
      .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
      .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
      .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
      .leftJoin(schema.quoteTags, eq(schema.quotes.id, schema.quoteTags.quoteId))
      .leftJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
      .where(and(...conditions))
      .groupBy(schema.quotes.id)
      .orderBy(sortBy in schema.quotes ? sortOrder(schema.quotes[sortBy]) : desc(schema.quotes.createdAt))
      .limit(limit)
      .offset(offset)

    const countQuery = db.select({ total: countDistinct(schema.quotes.id) })
      .from(schema.quotes)
      .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
      .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
      .where(and(...conditions))

    const [quotesResult, countResult] = await Promise.all([
      quotesQuery,
      countQuery
    ])

    const quotes = quotesResult as unknown as DatabaseQuoteWithRelations[]
    const transformedQuotes = transformQuotes(quotes)

    const total = Number(countResult[0]?.total) || 0
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