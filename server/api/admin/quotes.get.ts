import { db } from 'hub:db'
import { sql, SQL } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireModerator(event)
    
    const query = getQuery(event)
    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const offset = (page - 1) * limit
    const search = (query.search as string || '').trim()
    const status = (query.status as string || 'approved').trim()
    const language = (query.language as string || '').trim()
    
    const conditions: SQL[] = [sql`q.status = ${status}`]
    
    if (search) {
      const p = `%${search}%`
      conditions.push(sql`(q.name LIKE ${p} OR a.name LIKE ${p} OR r.name LIKE ${p} OR u.name LIKE ${p})`)
    }
    
    if (language) {
      conditions.push(sql`q.language = ${language}`)
    }
    
    const whereClause = conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``
    
    const quotesResult = await db.all<DatabaseAdminQuote>(sql`
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
      ORDER BY q.moderated_at DESC, q.created_at DESC
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
    const hasMore = offset + quotesResult.length < total
    const processedQuotes = transformAdminQuotes(quotesResult)
    
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
    if ((error as any).statusCode) throw error
    console.error('Admin quotes error:', error)
    throwServer(500, 'Failed to fetch quotes')
  }
})
