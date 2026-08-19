import { db, schema } from 'hub:db'
import { and, eq, like, sql, count } from 'drizzle-orm'
import { getPagination, buildPaginationMeta } from './pagination.service'

export interface ReferenceFilters {
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export async function findReferences(filters: ReferenceFilters) {
  const { page, limit, offset } = getPagination(filters)

  const allowedSort = ['name', 'created_at', 'views_count', 'likes_count', 'quotes_count']
  const sortBy = allowedSort.includes(filters.sortBy || '') ? filters.sortBy : 'name'
  const sortDir = filters.sortOrder === 'asc' ? 'ASC' : 'DESC'

  let whereClause = ''
  const params: any[] = []
  if (filters.search) {
    whereClause = `WHERE r.name LIKE ? OR r.description LIKE ? OR r.secondary_type LIKE ?`
    const q = `%${filters.search}%`
    params.push(q, q, q)
  }

  const referencesQuery = sql.raw(`
    SELECT r.*, COUNT(DISTINCT q.id) as quotes_count
    FROM quote_references r
    LEFT JOIN quote_attributions qa ON r.id = qa.reference_id
    LEFT JOIN quotes q ON q.id = qa.quote_id AND q.status = 'approved'
    ${whereClause}
    GROUP BY r.id
    ORDER BY r.${sortBy} ${sortDir}
    LIMIT ? OFFSET ?
  `, ...params, limit, offset)
  const references = await db.all<Record<string, any>>(referencesQuery)

  const countQuery = sql.raw(`
    SELECT COUNT(*) as total FROM (
      SELECT r.id FROM quote_references r
      LEFT JOIN quote_attributions qa ON r.id = qa.reference_id
      LEFT JOIN quotes q ON q.id = qa.quote_id AND q.status = 'approved'
      ${whereClause}
      GROUP BY r.id
    )
  `, ...params)
  const countResult = await db.get<{ total: number }>(countQuery)

  const total = countResult?.total || 0
  return { data: references, pagination: buildPaginationMeta(total, page, limit) }
}

export async function findReferenceById(id: number) {
  return db.select().from(schema.quoteReferences).where(eq(schema.quoteReferences.id, id)).get()
}

export async function searchReferences(query: string, limit = 20) {
  const searchQuery = sql.raw(`
    SELECT id, name, primary_type, secondary_type, release_date, description, image_url, views_count, likes_count
    FROM quote_references r
    WHERE r.name LIKE ?
    ORDER BY CASE WHEN r.name LIKE ? THEN 0 ELSE 1 END, r.likes_count DESC, r.name ASC
    LIMIT ?
  `, `%${query}%`, `${query}%`, limit)
  return db.all<Record<string, any>>(searchQuery)
}

export async function countReferenceQuotes(referenceId: number) {
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(schema.quoteAttributions)
    .innerJoin(schema.quotes, eq(schema.quoteAttributions.quoteId, schema.quotes.id))
    .where(and(
      eq(schema.quoteAttributions.referenceId, referenceId),
      eq(schema.quotes.status, 'approved'),
    ))
    .get()
  return Number(result?.count) || 0
}
