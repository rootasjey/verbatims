import { db, schema } from 'hub:db'
import { eq, and, like, desc, asc, count, sql } from 'drizzle-orm'
import type { PaginationParams } from './pagination.service'
import { getPagination, buildPaginationMeta } from './pagination.service'

export interface AuthorFilters {
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export async function findAuthors(filters: AuthorFilters) {
  const { page, limit, offset } = getPagination(filters)

  const allowedSort = ['name', 'created_at', 'views_count', 'likes_count', 'quotes_count']
  const sortBy = allowedSort.includes(filters.sortBy || '') ? filters.sortBy : 'name'
  const sortDir = filters.sortOrder === 'asc' ? 'ASC' : 'DESC'

  let whereClause = ''
  const params: any[] = []
  if (filters.search) {
    whereClause = `WHERE a.name LIKE ? OR a.description LIKE ? OR a.job LIKE ?`
    const q = `%${filters.search}%`
    params.push(q, q, q)
  }

  const authorsQuery = sql.raw(`
    SELECT a.*, COUNT(DISTINCT q.id) as quotes_count,
      (SELECT r.id FROM quotes q2
       JOIN quote_attributions qa2 ON qa2.quote_id = q2.id
       JOIN quote_references r ON r.id = qa2.reference_id
       WHERE qa2.author_id = a.id AND q2.status = 'approved' AND qa2.reference_id IS NOT NULL
       GROUP BY qa2.reference_id
       ORDER BY COUNT(*) DESC, MAX(q2.created_at) DESC
       LIMIT 1) AS origin_reference_id,
      (SELECT r.name FROM quotes q2
       JOIN quote_attributions qa2 ON qa2.quote_id = q2.id
       JOIN quote_references r ON r.id = qa2.reference_id
       WHERE qa2.author_id = a.id AND q2.status = 'approved' AND qa2.reference_id IS NOT NULL
       GROUP BY qa2.reference_id
       ORDER BY COUNT(*) DESC, MAX(q2.created_at) DESC
       LIMIT 1) AS origin_reference_name
    FROM authors a
    LEFT JOIN quote_attributions qa ON a.id = qa.author_id
    LEFT JOIN quotes q ON q.id = qa.quote_id AND q.status = 'approved'
    ${whereClause}
    GROUP BY a.id
    ORDER BY a.${sortBy} ${sortDir}
    LIMIT ? OFFSET ?
  `, ...params, limit, offset)
  const authors = await db.all<Record<string, any>>(authorsQuery)

  const countQuery = sql.raw(`
    SELECT COUNT(*) as total FROM (
      SELECT a.id FROM authors a
      LEFT JOIN quote_attributions qa ON a.id = qa.author_id
      LEFT JOIN quotes q ON q.id = qa.quote_id AND q.status = 'approved'
      ${whereClause}
      GROUP BY a.id
    )
  `, ...params)
  const countResult = await db.get<{ total: number }>(countQuery)

  const total = countResult?.total || 0
  return { data: authors, pagination: buildPaginationMeta(total, page, limit) }
}

export async function findAuthorById(id: number) {
  return db.select().from(schema.authors).where(eq(schema.authors.id, id)).get()
}

export async function searchAuthors(query: string, limit = 20) {
  const searchQuery = sql.raw(`
    SELECT id, name, is_fictional, job, image_url, views_count, likes_count
    FROM authors a
    WHERE a.name LIKE ?
    ORDER BY CASE WHEN a.name LIKE ? THEN 0 ELSE 1 END, a.likes_count DESC, a.name ASC
    LIMIT ?
  `, `%${query}%`, `${query}%`, limit)
  return db.all<Record<string, any>>(searchQuery)
}

export async function countAuthorQuotes(authorId: number) {
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(schema.quoteAttributions)
    .innerJoin(schema.quotes, eq(schema.quoteAttributions.quoteId, schema.quotes.id))
    .where(and(
      eq(schema.quoteAttributions.authorId, authorId),
      eq(schema.quotes.status, 'approved'),
    ))
    .get()
  return Number(result?.count) || 0
}
