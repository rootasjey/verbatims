import { db, schema } from 'hub:db'
import { eq, and, inArray } from 'drizzle-orm'
import { chunkForD1Bindings } from '~~/server/utils/d1-parameter-batching'

export type LikeableEntity = 'quote' | 'author' | 'reference'

const entityCountColumns = {
  quote: schema.quotes.likesCount,
  author: schema.authors.likesCount,
  reference: schema.quoteReferences.likesCount,
} as const

const entityTables = {
  quote: schema.quotes,
  author: schema.authors,
  reference: schema.quoteReferences,
} as const

const entityIdColumns = {
  quote: schema.quotes.id,
  author: schema.authors.id,
  reference: schema.quoteReferences.id,
} as const

export async function findExistingLike(
  entityType: LikeableEntity,
  entityId: number,
  userId: number
) {
  return db.select({ id: schema.userLikes.id })
    .from(schema.userLikes)
    .where(and(
      eq(schema.userLikes.userId, userId),
      eq(schema.userLikes.likeableType, entityType),
      eq(schema.userLikes.likeableId, entityId)
    ))
    .get()
}

export async function deleteLike(
  entityType: LikeableEntity,
  entityId: number,
  userId: number
) {
  await db.delete(schema.userLikes)
    .where(and(
      eq(schema.userLikes.userId, userId),
      eq(schema.userLikes.likeableType, entityType),
      eq(schema.userLikes.likeableId, entityId)
    ))
}

export async function insertLike(
  entityType: LikeableEntity,
  entityId: number,
  userId: number
) {
  await db.insert(schema.userLikes).values({
    userId,
    likeableType: entityType,
    likeableId: entityId,
  })
}

export async function getLikesCount(
  entityType: LikeableEntity,
  entityId: number
): Promise<number> {
  const table = entityTables[entityType]
  const idColumn = entityIdColumns[entityType]
  const result = await db.select({ likesCount: entityCountColumns[entityType] })
    .from(table)
    .where(eq(idColumn, entityId))
    .get()

  return result?.likesCount ?? 0
}

export async function toggleLike(
  entityType: LikeableEntity,
  entityId: number,
  userId: number,
): Promise<{ isLiked: boolean; likesCount: number }> {
  const existingLike = await findExistingLike(entityType, entityId, userId)

  if (existingLike) {
    await deleteLike(entityType, entityId, userId)
  } else {
    await insertLike(entityType, entityId, userId)
  }

  const likesCount = await getLikesCount(entityType, entityId)
  return { isLiked: !existingLike, likesCount }
}

export async function addQuoteLikes(quoteIds: number[], userId: number): Promise<number[]> {
  if (quoteIds.length === 0) return []

  const insertedLikes: { quoteId: number }[] = []
  for (const quoteIdBatch of chunkForD1Bindings(quoteIds, 3)) {
    insertedLikes.push(...await db.insert(schema.userLikes)
      .values(quoteIdBatch.map(likeableId => ({ userId, likeableType: 'quote' as const, likeableId })))
      .onConflictDoNothing()
      .returning({ quoteId: schema.userLikes.likeableId })
      .all())
  }

  return insertedLikes.map(like => like.quoteId)
}

export async function removeQuoteLikes(quoteIds: number[], userId: number): Promise<void> {
  if (quoteIds.length === 0) return

  for (const quoteIdBatch of chunkForD1Bindings(quoteIds, 1, 2)) {
    await db.delete(schema.userLikes)
      .where(and(
        eq(schema.userLikes.userId, userId),
        eq(schema.userLikes.likeableType, 'quote'),
        inArray(schema.userLikes.likeableId, quoteIdBatch)
      ))
      .run()
  }
}
