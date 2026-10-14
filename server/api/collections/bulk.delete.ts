import { inArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)
  const body = await readBody<{ collectionIds?: unknown }>(event)
  const rawIds = body?.collectionIds

  if (
    !Array.isArray(rawIds)
    || rawIds.length === 0
    || rawIds.length > 100
    || !rawIds.every(id => Number.isInteger(id) && Number(id) > 0)
  ) {
    throwServer(400, 'Provide between 1 and 100 valid collection IDs')
  }

  const collectionIds = [...new Set(rawIds as number[])]
  if (collectionIds.length !== rawIds.length) {
    throwServer(400, 'Collection IDs must be unique')
  }

  const collections = await db.select({
    id: schema.userCollections.id,
    userId: schema.userCollections.userId
  })
    .from(schema.userCollections)
    .where(inArray(schema.userCollections.id, collectionIds))
    .all()

  if (collections.length !== collectionIds.length) {
    throwServer(404, 'One or more lists were not found')
  }

  const canDeleteAny = user.role === 'admin' || user.role === 'moderator'
  if (!canDeleteAny && collections.some(collection => collection.userId !== user.id)) {
    throwServer(403, 'Access denied')
  }

  // The FK cascade removes collection_quotes rows only; quote rows are untouched.
  await db.delete(schema.userCollections)
    .where(inArray(schema.userCollections.id, collectionIds))
    .run()

  return {
    success: true,
    data: { deletedIds: collectionIds }
  }
})
