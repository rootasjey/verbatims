import { db, schema } from 'hub:db'
import { sql, SQL } from 'drizzle-orm'
import type { DatabaseAdminQuote } from '~~/server/types'
import { transformAdminQuotes } from '~~/server/utils/quote-transformer'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireModerator(event)

    const query = getQuery(event)

    const page = Math.max(parseInt(query.page as string) || 1, 1)
    const limit = Math.min(parseInt(query.limit as string) || 20, 100)
    const offset = (page - 1) * limit

    const status = (query.status as string) || 'approved'
    const language = (query.language as string) || ''
    const search = (query.search as string) || ''

    const conditions: SQL[] = [sql`q.status = ${status}`]

    if (language) {
      conditions.push(sql`q.language = ${language}`)
    }

    if (search) {
      const like = `%${search}%`
      conditions.push(sql`(q.name LIKE ${like} OR a.name LIKE ${like} OR r.name LIKE ${like} OR u.name LIKE ${like})`)
    }

    const whereClause = conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``

    const quotes = await db.all<DatabaseAdminQuote>(sql`
      SELECT
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
        a.image_url as author_image_url,
        r.name as reference_name,
        r.primary_type as reference_type,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar_url,
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
      ORDER BY q.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const totalRow = await db.get<{ total: number }>(sql`
      SELECT COUNT(DISTINCT q.id) as total
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
      ${whereClause}
    `)

    const total = totalRow?.total || 0
    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages

    const data = transformAdminQuotes(quotes)

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore
      }
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    console.error('Admin quotes index error:', error)
    throwServer(500, 'Failed to fetch admin quotes')
  }
})
