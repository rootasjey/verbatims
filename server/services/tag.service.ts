import { db, schema } from 'hub:db'
import { eq, like, and, count, sql } from 'drizzle-orm'
import { getPagination, buildPaginationMeta } from './pagination.service'

export interface TagFilters {
  search?: string
  page?: number
  limit?: number
}

export async function findTags(filters: TagFilters) {
  const { page, limit, offset } = getPagination(filters)

  const conditions: any[] = []
  if (filters.search) conditions.push(like(schema.tags.name, `%${filters.search}%`))

  const tags = await db.select({
    id: schema.tags.id,
    name: schema.tags.name,
    color: schema.tags.color,
    quoteCount: sql<number>`(
      SELECT COUNT(*) FROM ${schema.quoteTags}
      WHERE ${schema.quoteTags.tagId} = ${schema.tags.id}
    )`,
  })
    .from(schema.tags)
    .where(and(...conditions))
    .orderBy(schema.tags.name)
    .limit(limit)
    .offset(offset)
    .all()

  const countResult = await db.select({ total: count() })
    .from(schema.tags)
    .where(and(...conditions))
    .get()

  const total = Number(countResult?.total) || 0
  return { data: tags, pagination: buildPaginationMeta(total, page, limit) }
}

export async function findTagByName(name: string) {
  return db.select()
    .from(schema.tags)
    .where(eq(schema.tags.name, name))
    .get()
}

export async function findTagById(id: number) {
  return db.select()
    .from(schema.tags)
    .where(eq(schema.tags.id, id))
    .get()
}

export async function createTag(data: { name: string; color?: string }) {
  const [tag] = await db.insert(schema.tags)
    .values({ name: data.name, color: data.color || null })
    .returning({ id: schema.tags.id, name: schema.tags.name, color: schema.tags.color })
  return tag
}

export async function updateTag(id: number, data: { name?: string; color?: string }) {
  const setData: Record<string, any> = {}
  if (data.name !== undefined) setData.name = data.name
  if (data.color !== undefined) setData.color = data.color || null

  await db.update(schema.tags)
    .set(setData)
    .where(eq(schema.tags.id, id))
    .run()
}

export async function deleteTag(id: number) {
  await db.delete(schema.quoteTags).where(eq(schema.quoteTags.tagId, id)).run()
  await db.delete(schema.tags).where(eq(schema.tags.id, id)).run()
}

export async function addTagToQuote(quoteId: number, tagId: number) {
  await db.insert(schema.quoteTags)
    .values({ quoteId, tagId })
    .onConflictDoNothing()
    .run()
}

export async function removeTagFromQuote(quoteId: number, tagId: number) {
  await db.delete(schema.quoteTags)
    .where(and(
      eq(schema.quoteTags.quoteId, quoteId),
      eq(schema.quoteTags.tagId, tagId),
    ))
    .run()
}
