import { db, schema } from 'hub:db'
import { eq, and, desc, asc, sql, count, countDistinct, inArray } from 'drizzle-orm'
import type { DatabaseQuoteWithRelations } from '../../shared/types/quote'
import type { PaginationMeta } from './pagination.service'
import { getPagination, buildPaginationMeta } from './pagination.service'
import { getPrimaryQuoteProvenance, getQuoteProvenance, syncPrimaryAttribution } from '../utils/quote-provenance'

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
  id: schema.quotes.id,
  name: schema.quotes.name,
  language: schema.quotes.language,
  status: schema.quotes.status,
  userId: schema.quotes.userId,
  moderatorId: schema.quotes.moderatorId,
  moderatedAt: schema.quotes.moderatedAt,
  rejectionReason: schema.quotes.rejectionReason,
  viewsCount: schema.quotes.viewsCount,
  likesCount: schema.quotes.likesCount,
  sharesCount: schema.quotes.sharesCount,
  isFeatured: schema.quotes.isFeatured,
  createdAt: schema.quotes.createdAt,
  updatedAt: schema.quotes.updatedAt,
  user_name: schema.users.name,
  tag_names: sql<string>`GROUP_CONCAT(${schema.tags.name})`,
  tag_colors: sql<string>`GROUP_CONCAT(${schema.tags.color})`,
} as const

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
  if (filters.authorId) conditions.push(sql`EXISTS (SELECT 1 FROM ${schema.quoteAttributions} WHERE quote_id = ${schema.quotes.id} AND author_id = ${filters.authorId})`)
  if (filters.referenceId) conditions.push(sql`EXISTS (SELECT 1 FROM ${schema.quoteAttributions} WHERE quote_id = ${schema.quotes.id} AND reference_id = ${filters.referenceId})`)
  if (filters.userId) conditions.push(eq(schema.quotes.userId, filters.userId))
  if (filters.search) {
    const ns = normalizeSearch(filters.search)
    if (ns.hasContent) conditions.push(sql`${schema.quotes.id} IN (SELECT rowid FROM quotes_fts WHERE name MATCH ${ns.toMatchQuery()})`)
  }
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
    .where(and(...conditions))

  const total = Number(countResult[0]?.total) || 0
  const pagination = buildPaginationMeta(total, page, limit)

  const provenance = await getPrimaryQuoteProvenance(quotes.map(quote => quote.id))
  const enrichedQuotes = quotes.map(quote => ({
    ...quote,
    provenance: provenance.get(quote.id),
  }))

  return {
    data: transformQuotes(enrichedQuotes as any),
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
    userId: schema.quotes.userId,
    userName: schema.users.name,
  })
    .from(schema.quotes)
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
  const authorId = data.authorId ?? null
  const referenceId = data.referenceId ?? null
  if (authorId == null && referenceId == null) {
    throw new Error('A quote requires an author or reference')
  }

  let result: { id: number } | undefined
  try {
    result = await db.insert(schema.quotes)
      .values({
        name: data.name.trim(),
        language: data.language || 'en',
        userId: data.userId,
        status: (data.status || 'draft') as any,
      } as any)
      .returning({ id: schema.quotes.id })
      .get()
    await syncPrimaryAttribution(result.id, authorId, referenceId, data.userId)
  } catch (error) {
    if (result?.id) {
      await db.delete(schema.quotes).where(eq(schema.quotes.id, result.id)).run().catch(() => undefined)
    }
    throw error
  }

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
  if (data.status !== undefined) setData.status = data.status as any

  const needsAttributionUpdate = data.authorId !== undefined || data.referenceId !== undefined
  let attributionStatement: any
  if (needsAttributionUpdate) {
      const quote = await db.select({ userId: schema.quotes.userId })
        .from(schema.quotes)
        .where(eq(schema.quotes.id, id))
        .get()
      if (!quote) throw new Error('Quote not found')

      const provenance = await getQuoteProvenance(id)
      const primary = provenance.attributions.find(item => item.is_primary) ?? provenance.attributions[0]
      const authorId = data.authorId !== undefined ? data.authorId : primary?.author_id ?? null
      const referenceId = data.referenceId !== undefined ? data.referenceId : primary?.reference_id ?? null
      if (authorId == null && referenceId == null) {
        throw new Error('A quote requires an author or reference')
      }
      if (!primary) throw new Error('Quote has no primary attribution')
      attributionStatement = db.update(schema.quoteAttributions)
        .set({ authorId, referenceId, updatedAt: new Date() })
        .where(eq(schema.quoteAttributions.id, primary.id))
  }

  const statements = [
    ...(attributionStatement ? [attributionStatement] : []),
    db.update(schema.quotes).set(setData).where(eq(schema.quotes.id, id)),
  ]
  await db.batch(statements as any)
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
