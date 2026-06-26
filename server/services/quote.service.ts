import { db, schema } from 'hub:db'
import { eq, and, like, desc, asc, sql, count, countDistinct, getTableColumns, inArray } from 'drizzle-orm'
import type { DatabaseQuoteWithRelations } from '../../shared/types/quote'
import type { PaginationMeta } from './pagination.service'
import { getPagination, buildPaginationMeta } from './pagination.service'

export type QuoteStatus = 'harvested' | 'draft' | 'pending' | 'approved' | 'rejected'

export interface QuoteFilters {
  status?: QuoteStatus
  language?: string
  authorId?: number
  referenceId?: number
  search?: string
  tag?: string
  userId?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
  maxLimit?: number
}

const quoteColumns = {
  ...getTableColumns(schema.quotes),
  author_name: schema.authors.name,
  author_is_fictional: schema.authors.isFictional,
  author_image_url: schema.authors.imageUrl,
  reference_name: schema.quoteReferences.name,
  reference_type: schema.quoteReferences.primaryType,
  user_name: schema.users.name,
  tag_names: sql<string>`GROUP_CONCAT(${schema.tags.name})`,
  tag_colors: sql<string>`GROUP_CONCAT(${schema.tags.color})`,
} as const

const baseJoins = {
  author: (qb: any) => qb.leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id)),
  reference: (qb: any) => qb.leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id)),
  user: (qb: any) => qb.leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id)),
  tags: (qb: any) => qb
    .leftJoin(schema.quoteTags, eq(schema.quotes.id, schema.quoteTags.quoteId))
    .leftJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id)),
}

const defaultSortable: Record<string, any> = {
  created_at: schema.quotes.createdAt,
  likes_count: schema.quotes.likesCount,
  views_count: schema.quotes.viewsCount,
  shares_count: schema.quotes.sharesCount,
  updated_at: schema.quotes.updatedAt,
}

function buildQuoteWhere(filters: QuoteFilters) {
  const conditions = [eq(schema.quotes.status, (filters.status || 'approved') as any)]
  if (filters.language) conditions.push(eq(schema.quotes.language, filters.language as any))
  if (filters.authorId) conditions.push(eq(schema.quotes.authorId, filters.authorId))
  if (filters.referenceId) conditions.push(eq(schema.quotes.referenceId, filters.referenceId))
  if (filters.userId) conditions.push(eq(schema.quotes.userId, filters.userId))
  if (filters.search) conditions.push(like(schema.quotes.name, `%${filters.search}%`))
  if (filters.tag?.trim()) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM ${schema.quoteTags} qt2
      INNER JOIN ${schema.tags} t2 ON qt2.tag_id = t2.id
      WHERE qt2.quote_id = ${schema.quotes.id}
        AND LOWER(t2.name) = LOWER(${filters.tag.trim()})
    )`)
  }
  return conditions
}

export async function findQuotes(filters: QuoteFilters) {
  const { page, limit, offset } = getPagination(filters)
  const conditions = buildQuoteWhere(filters)

  const sortByCol = defaultSortable[filters.sortBy || 'created_at'] ?? schema.quotes.createdAt
  const sortOrderFn = filters.sortOrder === 'asc' ? asc : desc

  const quotes = await db.select(quoteColumns)
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
    .leftJoin(schema.quoteTags, eq(schema.quotes.id, schema.quoteTags.quoteId))
    .leftJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
    .where(and(...conditions))
    .groupBy(schema.quotes.id)
    .orderBy(sortOrderFn(sortByCol))
    .limit(limit)
    .offset(offset)

  const countResult = await db.select({ total: countDistinct(schema.quotes.id) })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .where(and(...conditions))

  const total = Number(countResult[0]?.total) || 0
  const pagination = buildPaginationMeta(total, page, limit)

  return {
    data: transformQuotes(quotes as any),
    pagination,
  }
}

export async function findQuoteById(id: number, status?: QuoteStatus) {
  const conditions: any[] = [eq(schema.quotes.id, id)]
  if (status) conditions.push(eq(schema.quotes.status, status as any))

  const quote = await db.select({
    id: schema.quotes.id,
    name: schema.quotes.name,
    language: schema.quotes.language,
    status: schema.quotes.status,
    viewsCount: schema.quotes.viewsCount,
    likesCount: schema.quotes.likesCount,
    sharesCount: schema.quotes.sharesCount,
    isFeatured: schema.quotes.isFeatured,
    createdAt: schema.quotes.createdAt,
    updatedAt: schema.quotes.updatedAt,
    authorId: schema.quotes.authorId,
    referenceId: schema.quotes.referenceId,
    userId: schema.quotes.userId,
    authorName: schema.authors.name,
    authorIsFictional: schema.authors.isFictional,
    authorImageUrl: schema.authors.imageUrl,
    referenceName: schema.quoteReferences.name,
    referencePrimaryType: schema.quoteReferences.primaryType,
    userName: schema.users.name,
  })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
    .where(and(...conditions))
    .get()

  if (!quote) return null

  const tags = await findTagsForQuote(id)

  return { ...quote, tags }
}

export async function findTagsForQuote(quoteId: number) {
  return db.select({ id: schema.tags.id, name: schema.tags.name, color: schema.tags.color })
    .from(schema.tags)
    .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
    .where(eq(schema.quoteTags.quoteId, quoteId))
    .all()
}

export async function findTagsForQuotes(quoteIds: number[]) {
  const rows = await db.select({
    quoteId: schema.quoteTags.quoteId,
    name: schema.tags.name,
    color: schema.tags.color,
  })
    .from(schema.quoteTags)
    .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
    .where(inArray(schema.quoteTags.quoteId, quoteIds))
    .all()

  const map = new Map<number, { name: string; color: string | null }[]>()
  for (const row of rows) {
    if (row.quoteId === null) continue
    if (!map.has(row.quoteId)) map.set(row.quoteId, [])
    map.get(row.quoteId)!.push({ name: row.name!, color: row.color })
  }
  return map
}

export async function countQuotes(filters: Omit<QuoteFilters, 'page' | 'limit' | 'sortBy' | 'sortOrder'>) {
  const conditions = buildQuoteWhere(filters)
  const result = await db.select({ total: count() })
    .from(schema.quotes)
    .where(and(...conditions))
  return Number(result[0]?.total) || 0
}

export async function createQuote(data: {
  name: string
  language?: string
  authorId?: number | null
  referenceId?: number | null
  userId: number
  status?: QuoteStatus
}) {
  const result = await db.insert(schema.quotes)
    .values({
      name: data.name.trim(),
      language: data.language || 'en',
      authorId: data.authorId ?? null,
      referenceId: data.referenceId ?? null,
      userId: data.userId,
      status: (data.status || 'draft') as any,
    } as any)
    .returning({ id: schema.quotes.id })
    .get()

  return result!
}

export async function updateQuote(
  id: number,
  data: {
    name?: string
    language?: string
    authorId?: number | null
    referenceId?: number | null
    status?: QuoteStatus
  },
) {
  const setData: Record<string, any> = { updatedAt: sql`CURRENT_TIMESTAMP` }
  if (data.name !== undefined) setData.name = data.name.trim()
  if (data.language !== undefined) setData.language = data.language
  if (data.authorId !== undefined) setData.authorId = data.authorId ?? null
  if (data.referenceId !== undefined) setData.referenceId = data.referenceId ?? null
  if (data.status !== undefined) setData.status = data.status as any

  await db.update(schema.quotes)
    .set(setData)
    .where(eq(schema.quotes.id, id))
    .run()
}

export async function updateQuoteStatus(
  id: number,
  status: QuoteStatus,
  moderatorId?: number,
  rejectionReason?: string | null,
) {
  const setData: Record<string, any> = {
    status: status as any,
    updatedAt: sql`CURRENT_TIMESTAMP`,
  }
  if (moderatorId !== undefined) {
    setData.moderatorId = moderatorId
    setData.moderatedAt = sql`CURRENT_TIMESTAMP`
  }
  if (rejectionReason !== undefined) {
    setData.rejectionReason = rejectionReason ?? null
  }

  await db.update(schema.quotes)
    .set(setData)
    .where(eq(schema.quotes.id, id))
    .run()
}

export async function deleteQuote(id: number) {
  await db.delete(schema.quotes)
    .where(eq(schema.quotes.id, id))
    .run()
}

export async function findQuoteRaw(id: number) {
  return db.select()
    .from(schema.quotes)
    .where(eq(schema.quotes.id, id))
    .get()
}

export type { PaginationMeta }
