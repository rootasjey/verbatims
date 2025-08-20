import { parseJSONSafely } from '~/server/utils/extraction'
import type { ReportCategory, ReportStatus, ReportTargetType, AdminUserMessage, AdminMessagesListResponse } from '~/types/report'

export default defineEventHandler(async (event): Promise<AdminMessagesListResponse> => {
  const session = await requireUserSession(event)
  if (!session.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const db = hubDatabase()
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page || 1))
  const limit = Math.min(100, Math.max(1, Number(query.limit || 50)))
  const offset = (page - 1) * limit
  const status = (query.status as ReportStatus) || undefined
  const category = (query.category as ReportCategory) || undefined
  const targetType = (query.target_type as ReportTargetType) || undefined
  const search = (query.search as string) || ''

  const where: string[] = []
  const binds: any[] = []

  if (status) { where.push('um.status = ?'); binds.push(status) }
  if (category) { where.push('um.category = ?'); binds.push(category) }
  if (targetType) { where.push('um.target_type = ?'); binds.push(targetType) }
  if (search) {
    where.push(`(
      um.message LIKE ? OR
      COALESCE(um.name,'') LIKE ? OR
      COALESCE(um.email,'') LIKE ?
    )`)
    binds.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const totalRow = await db.prepare(`
    SELECT COUNT(1) as cnt
    FROM user_messages um
    ${whereClause}
  `).bind(...binds).first()
  const total = Number((totalRow as any)?.cnt || 0)

  const rows = await db.prepare(`
    SELECT um.*, 
      q.name AS quote_text,
      a.name AS author_name,
      r.name AS reference_name,
      u.name AS user_name,
      u.email AS user_email
    FROM user_messages um
    LEFT JOIN quotes q ON (um.target_type = 'quote' AND q.id = um.target_id)
    LEFT JOIN authors a ON (um.target_type = 'author' AND a.id = um.target_id)
    LEFT JOIN quote_references r ON (um.target_type = 'reference' AND r.id = um.target_id)
    LEFT JOIN users u ON (um.user_id = u.id)
    ${whereClause}
    ORDER BY um.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...binds, limit, offset).all()

  const data = (rows?.results || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id ?? null,
      name: row.name ?? null,
      email: row.email ?? null,
      category: row.category,
  tags: parseJSONSafely(row.tags) || [],
      message: row.message,
      target_type: row.target_type,
      target_id: row.target_id ?? null,
      ip_address: row.ip_address ?? null,
      user_agent: row.user_agent ?? null,
      status: row.status,
      reviewed_by: row.reviewed_by ?? null,
      reviewed_at: row.reviewed_at ?? null,
      created_at: row.created_at,
      user_name: row.user_name ?? null,
      user_email: row.user_email ?? null,
      quote_text: row.quote_text ?? null,
      author_name: row.author_name ?? null,
      reference_name: row.reference_name ?? null,
      target_label: row.target_type === 'quote' ? (row.quote_text ?? '')
        : row.target_type === 'author' ? (row.author_name ?? '')
        : row.target_type === 'reference' ? (row.reference_name ?? '')
        : 'General'
  }))

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + limit < total
    }
  }
})
