import { db, schema } from 'hub:db'
import { and, desc, eq, like, or, sql } from 'drizzle-orm'
import { parseJSONSafely } from '~/server/utils/extraction'
import type { ReportCategory, ReportStatus, ReportTargetType, AdminUserMessage, AdminMessagesListResponse } from '~/types/report'

export default defineEventHandler(async (event): Promise<AdminMessagesListResponse> => {
  const session = await requireUserSession(event)
  if (!session.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page || 1))
  const limit = Math.min(100, Math.max(1, Number(query.limit || 50)))
  const offset = (page - 1) * limit
  const status = (query.status as ReportStatus) || undefined
  const category = (query.category as ReportCategory) || undefined
  const targetType = (query.target_type as ReportTargetType) || undefined
  const search = (query.search as string) || ''

  const conditions = []
  if (status) conditions.push(eq(schema.userMessages.status, status))
  if (category) conditions.push(eq(schema.userMessages.category, category))
  if (targetType) conditions.push(eq(schema.userMessages.targetType, targetType))
  if (search) {
    conditions.push(or(
      like(schema.userMessages.message, `%${search}%`),
      like(sql`COALESCE(${schema.userMessages.name}, '')`, `%${search}%`),
      like(sql`COALESCE(${schema.userMessages.email}, '')`, `%${search}%`)
    ))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [totalResult] = await db
    .select({ count: sql<number>`COUNT(1)` })
    .from(schema.userMessages)
    .where(whereClause)
  const total = Number(totalResult?.count || 0)

  const results = await db
    .select({
      id: schema.userMessages.id,
      user_id: schema.userMessages.userId,
      name: schema.userMessages.name,
      email: schema.userMessages.email,
      category: schema.userMessages.category,
      tags: schema.userMessages.tags,
      message: schema.userMessages.message,
      target_type: schema.userMessages.targetType,
      target_id: schema.userMessages.targetId,
      ip_address: schema.userMessages.ipAddress,
      user_agent: schema.userMessages.userAgent,
      status: schema.userMessages.status,
      reviewed_by: schema.userMessages.reviewedBy,
      reviewed_at: schema.userMessages.reviewedAt,
      created_at: schema.userMessages.createdAt,
      user_name: schema.users.name,
      user_email: schema.users.email,
      quote_text: schema.quotes.name,
      author_name: schema.authors.name,
      reference_name: schema.quoteReferences.name,
    })
    .from(schema.userMessages)
    .leftJoin(schema.quotes, and(
      eq(schema.userMessages.targetType, 'quote'),
      eq(schema.quotes.id, schema.userMessages.targetId)
    ))
    .leftJoin(schema.authors, and(
      eq(schema.userMessages.targetType, 'author'),
      eq(schema.authors.id, schema.userMessages.targetId)
    ))
    .leftJoin(schema.quoteReferences, and(
      eq(schema.userMessages.targetType, 'reference'),
      eq(schema.quoteReferences.id, schema.userMessages.targetId)
    ))
    .leftJoin(schema.users, eq(schema.userMessages.userId, schema.users.id))
    .where(whereClause)
    .orderBy(desc(schema.userMessages.createdAt))
    .limit(limit)
    .offset(offset)

  const data = results.map((row) => ({
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
