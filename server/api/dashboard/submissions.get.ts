import { db, schema } from 'hub:db'
import { eq, and, like, or, desc, count, getTableColumns } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 10, 100)
    const page = parseInt(query.page as string) || 1
    const offset = (page - 1) * limit
    const status = query.status as string
    const language = query.language as string
    const search = query.search as string || ''

    // Build conditions array for dynamic filtering
    const conditions = [eq(schema.quotes.userId, session.user.id)]

    if (status && ['draft', 'pending', 'approved', 'rejected'].includes(status)) {
      conditions.push(eq(schema.quotes.status, status as any))
    }

    if (language) {
      conditions.push(eq(schema.quotes.language, language as any))
    }

    if (search) {
      const searchCondition = or(
        like(schema.quotes.name, `%${search}%`),
        like(schema.authors.name, `%${search}%`),
        like(schema.quoteReferences.name, `%${search}%`)
      )
      if (searchCondition) conditions.push(searchCondition)
    }

    // Get user's submissions with related data
    const submissions = await db.select({
      ...getTableColumns(schema.quotes),
      author_name: schema.authors.name,
      author_is_fictional: schema.authors.isFictional,
      reference_name: schema.quoteReferences.name,
      reference_type: schema.quoteReferences.primaryType,
      moderator_name: schema.users.name
    })
      .from(schema.quotes)
      .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
      .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
      .leftJoin(schema.users, eq(schema.quotes.moderatorId, schema.users.id))
      .where(and(...conditions))
      .orderBy(desc(schema.quotes.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const totalResult = await db.select({ total: count() })
      .from(schema.quotes)
      .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
      .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
      .where(and(...conditions))

    const total = Number(totalResult[0]?.total) || 0
    const hasMore = offset + submissions.length < total

    // Get tags for each submission
    const processedSubmissions = await Promise.all(submissions.map(async (submission: any) => {
      // Get tags for this quote
      const tags = await db.select({
        id: schema.tags.id,
        name: schema.tags.name,
        color: schema.tags.color
      })
        .from(schema.tags)
        .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
        .where(eq(schema.quoteTags.quoteId, submission.id))

      return {
        ...submission,
        author: submission.author_name ? {
          name: submission.author_name,
          is_fictional: submission.author_is_fictional
        } : null,
        reference: submission.reference_name ? {
          name: submission.reference_name,
          primary_type: submission.reference_type
        } : null,
        tags: tags
      }
    }))
    
    return {
      success: true,
      data: processedSubmissions,
      pagination: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    if (error?.statusCode) {
      throw error
    }

    console.error('Dashboard submissions error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch submissions'
    })
  }
})
