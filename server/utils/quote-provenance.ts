import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'

export async function syncPrimaryAttribution(
  quoteId: number,
  authorId: number | null,
  referenceId: number | null,
  userId: number,
) {
  const existing = await db.select({ id: schema.quoteAttributions.id })
    .from(schema.quoteAttributions)
    .where(and(
      eq(schema.quoteAttributions.quoteId, quoteId),
      eq(schema.quoteAttributions.isPrimary, true),
    ))
    .get()

  const values = {
    authorId,
    referenceId,
    isPrimary: true,
    updatedAt: new Date(),
  }

  if (existing) {
    await db.update(schema.quoteAttributions)
      .set(values)
      .where(eq(schema.quoteAttributions.id, existing.id))
      .run()
    return existing.id
  }

  const created = await db.insert(schema.quoteAttributions)
    .values({ ...values, quoteId, createdBy: userId })
    .returning({ id: schema.quoteAttributions.id })
    .get()
  return created.id
}

export async function syncPrimarySource(
  quoteId: number,
  attributionId: number,
  sourceType: string | null | undefined,
  sourceUrl: string | null | undefined,
  userId: number,
) {
  if (!sourceType && !sourceUrl) return

  const existing = await db.select({ id: schema.quoteSources.id })
    .from(schema.quoteSources)
    .where(and(
      eq(schema.quoteSources.quoteId, quoteId),
      eq(schema.quoteSources.isPrimary, true),
    ))
    .get()

  const values = {
    attributionId,
    sourceType: sourceType || 'manual',
    sourceUrl: sourceUrl || null,
    isPrimary: true,
    updatedAt: new Date(),
  }

  if (existing) {
    await db.update(schema.quoteSources)
      .set(values)
      .where(eq(schema.quoteSources.id, existing.id))
      .run()
    return existing.id
  }

  const created = await db.insert(schema.quoteSources)
    .values({ ...values, quoteId, createdBy: userId })
    .returning({ id: schema.quoteSources.id })
    .get()
  return created.id
}
