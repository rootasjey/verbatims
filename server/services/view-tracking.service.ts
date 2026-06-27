import { db, schema } from 'hub:db'
import { eq, and, or, isNotNull, isNull, gt, sql } from 'drizzle-orm'

export type TrackableEntity = 'quote' | 'author' | 'reference'

interface ViewTable {
  quote: typeof schema.quoteViews
  author: typeof schema.authorViews
  reference: typeof schema.referenceViews
}

const viewTables: ViewTable = {
  quote: schema.quoteViews,
  author: schema.authorViews,
  reference: schema.referenceViews,
}

const entityIdColumns = {
  quote: schema.quoteViews.quoteId,
  author: schema.authorViews.authorId,
  reference: schema.referenceViews.referenceId,
} as const

export async function trackView(
  entityType: TrackableEntity,
  entityId: number,
  userId: number | null,
  ip: string,
  userAgent: string,
): Promise<{ recorded: boolean }> {
  const table = viewTables[entityType]
  const entityIdCol = entityIdColumns[entityType]

  const oneHourAgo = sql`datetime('now', '-1 hour')`

  const recentView = await db.select({ id: table.id })
    .from(table)
    .where(and(
      eq(entityIdCol, entityId),
      or(
        and(
          eq(table.userId, userId ?? 0),
          isNotNull(table.userId),
        ),
        and(
          eq(table.ipAddress, ip),
          isNull(table.userId),
        ),
      ),
      gt(table.viewedAt, oneHourAgo),
    ))
    .limit(1)
    .get()

  if (recentView) return { recorded: false }

  if (entityType === 'quote') {
    await db.insert(table).values({
      quoteId: entityId,
      userId: userId ?? null,
      ipAddress: userId ? null : ip,
      userAgent,
    } as any)
  } else if (entityType === 'author') {
    await db.insert(table).values({
      authorId: entityId,
      userId: userId ?? null,
      ipAddress: userId ? null : ip,
      userAgent,
    } as any)
  } else {
    await db.insert(table).values({
      referenceId: entityId,
      userId: userId ?? null,
      ipAddress: userId ? null : ip,
      userAgent,
    } as any)
  }

  return { recorded: true }
}

export async function checkEntityExists(
  entityType: TrackableEntity,
  entityId: number,
  requireApproved?: boolean,
): Promise<boolean> {
  if (entityType !== 'quote') {
    const tables = { author: schema.authors, reference: schema.quoteReferences }
    const idCols = { author: schema.authors.id, reference: schema.quoteReferences.id }
    const row = await db.select({ id: idCols[entityType] })
      .from(tables[entityType])
      .where(eq(idCols[entityType], entityId))
      .get()
    return !!row
  }

  const conditions = [eq(schema.quotes.id, entityId)]
  if (requireApproved) conditions.push(eq(schema.quotes.status, 'approved'))

  const row = await db.select({ id: schema.quotes.id })
    .from(schema.quotes)
    .where(and(...conditions))
    .get()

  return !!row
}
