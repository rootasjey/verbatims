import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'
import type { CreatedQuoteResult } from '~~/server/types'

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) {
      throwServer(401, 'Authentication required')
    }
    if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
      throwServer(403, 'Admin or moderator access required')
    }

    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const offset = (page - 1) * limit
    const search = (query.search as string) || ''
    const status = (query.status as string) || 'pending'
    const language = (query.language as string) || ''

    const conditions = [sql`q.status = ${status}`]
    if (language) {
      conditions.push(sql`q.language = ${language}`)
    }
    if (search) {
      const pattern = `%${search}%`
      conditions.push(sql`(q.name LIKE ${pattern} OR a.name LIKE ${pattern} OR r.name LIKE ${pattern} OR u.name LIKE ${pattern})`)
    }

    const whereClause = conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``

    const quotes = await db.all<CreatedQuoteResult>(sql`
      SELECT
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
        a.image_url as author_image_url,
        r.name as reference_name,
        r.primary_type as reference_type,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar,
        m.name as moderator_name,
        GROUP_CONCAT(t.name) as tag_names,
        GROUP_CONCAT(t.color) as tag_colors
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN users m ON q.moderator_id = m.id
      LEFT JOIN quote_tags qt ON q.id = qt.quote_id
      LEFT JOIN tags t ON qt.tag_id = t.id
      ${whereClause}
      GROUP BY q.id
      ORDER BY q.created_at ASC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const totalResult = await db.get<{ total: number }>(sql`
      SELECT COUNT(*) as total
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
      ${whereClause}
    `)

    const total = totalResult?.total || 0
    const hasMore = offset + quotes.length < total

    // Process quotes data
    const processedQuotes = quotes.map((quote: CreatedQuoteResult) => ({
      ...quote,
      tags: quote.tag_names ? quote.tag_names.split(',').map((name: string, index: number) => ({
        name,
        color: quote.tag_colors?.split(',')[index] || 'gray'
      })) : []
    }))
    
    return {
      success: true,
      data: processedQuotes,
      pagination: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Admin pending quotes error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch pending quotes'
    })
  }
})
