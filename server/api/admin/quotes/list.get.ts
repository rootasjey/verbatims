import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'
import type { DatabaseAdminQuote } from '~~/server/types'
import { transformAdminQuotes } from '~~/server/utils/quote-transformer'

export default defineEventHandler(async (event) => {
  try {
    // Auth: admin or moderator
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }
    if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
      throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
    }

    const query = getQuery(event)

    const page = Math.max(parseInt(query.page as string) || 1, 1)
    const limit = Math.min(parseInt(query.limit as string) || 20, 100)
    const offset = (page - 1) * limit

    const status = (query.status as string) || 'approved'
    const language = (query.language as string) || ''
    const search = (query.search as string) || ''

    // WHERE conditions
    const conditions: string[] = [`q.status = '${status}'`]

    if (language) {
      conditions.push(`q.language = '${language}'`)
    }

    if (search) {
      const like = `%${search}%`
      conditions.push(`(q.name LIKE '${like}' OR a.name LIKE '${like}' OR r.name LIKE '${like}' OR u.name LIKE '${like}')`)
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    // Main query with joins for admin view
    const quotes = await db.all<DatabaseAdminQuote>(sql.raw(`
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
    `))

    // Count query
    const totalRow = await db.get<{ total: number }>(sql.raw(`
      SELECT COUNT(DISTINCT q.id) as total
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
      ${whereClause}
    `))

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
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch admin quotes' })
  }
})
