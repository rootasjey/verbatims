import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

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
