import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'
import type { DatabaseAdminQuote } from '~~/server/types'
import { transformAdminQuotes } from '~~/server/utils/quote-transformer'

export default defineEventHandler(async (event) => {
  try {
    // Auth: admin or moderator
    const { user } = await requireModerator(event)

    const query = getQuery(event)

    const page = Math.max(parseInt(query.page as string) || 1, 1)
    const limit = Math.min(parseInt(query.limit as string) || 20, 100)
    const offset = (page - 1) * limit

    const status = (query.status as string) || 'approved'
    const language = (query.language as string) || ''
    const search = (query.search as string) || ''

    // WHERE conditions with parameterized queries
    const params: any[] = []
    const conditions: string[] = ['q.status = ?']
    params.push(status)

    if (language) {
      conditions.push('q.language = ?')
      params.push(language)
    }

    if (search) {
      const like = `%${search}%`
      conditions.push('(q.name LIKE ? OR a.name LIKE ? OR r.name LIKE ? OR u.name LIKE ?)')
      params.push(like, like, like, like)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Main query with joins for admin view
    const allBindings = [...params, limit, offset]
    const quotes = await db.all<DatabaseAdminQuote>((sql.raw as any)(
      `SELECT
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
      LIMIT ? OFFSET ?`,
      ...allBindings,
    ))

    // Count query
    const totalRow = await db.get<{ total: number }>((sql.raw as any)(
      `SELECT COUNT(DISTINCT q.id) as total
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
      ${whereClause}`,
      ...params,
    ))

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
