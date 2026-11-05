import { and, asc, desc, eq, getTableColumns, gte, gt, inArray, like, lt, or } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const requestedLimit = Number(query.limit ?? 50)
  const order = query.order === undefined ? 'newest' : query.order
  const beforeId = query.before_id === undefined ? undefined : Number(query.before_id)
  const afterId = query.after_id === undefined ? undefined : Number(query.after_id)
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1) throwServer(400, 'Invalid limit')
  if (order !== 'newest' && order !== 'oldest') throwServer(400, 'Invalid order')
  if (beforeId !== undefined && (!Number.isInteger(beforeId) || beforeId < 1)) throwServer(400, 'Invalid before_id')
  if (afterId !== undefined && (!Number.isInteger(afterId) || afterId < 1)) throwServer(400, 'Invalid after_id')
  if ((beforeId !== undefined && afterId !== undefined) || (order === 'newest' && afterId !== undefined) || (order === 'oldest' && beforeId !== undefined)) {
    throwServer(400, 'Invalid audit cursor for order')
  }
  const limit = Math.min(requestedLimit, 100)
  const from = parseAuditDate(query.from, 'from')
  const to = parseAuditDate(query.to, 'to')
  if (from && to && from > to) throwServer(400, 'from must be before or equal to to')
  const toExclusive = to ? nextUtcDate(to) : null
  const actor = readAuditFilter(query.actor)
  const apiKey = readAuditFilter(query.api_key)
  const apiKeyId = apiKey && /^\d+$/.test(apiKey) ? Number(apiKey) : null
  const target = readAuditFilter(query.target)
  const action = readAuditFilter(query.action)
  const source = readAuditFilter(query.source)
  const filters = [
    order === 'newest' && beforeId ? lt(schema.quoteEditorialAuditEvents.id, beforeId) : undefined,
    order === 'oldest' && afterId ? gt(schema.quoteEditorialAuditEvents.id, afterId) : undefined,
    from ? gte(schema.quoteEditorialAuditEvents.occurredAt, `${from} 00:00:00`) : undefined,
    toExclusive ? lt(schema.quoteEditorialAuditEvents.occurredAt, `${toExclusive} 00:00:00`) : undefined,
    actor ? like(schema.quoteEditorialAuditEvents.actorUserName, `%${actor}%`) : undefined,
    apiKeyId ? eq(schema.quoteEditorialAuditEvents.apiKeyId, apiKeyId) : apiKey ? like(schema.quoteEditorialAuditEvents.apiKeyName, `%${apiKey}%`) : undefined,
    target ? or(
      like(schema.quoteEditorialAuditEvents.targetType, `%${target}%`),
      like(schema.quoteEditorialAuditEvents.targetId, `%${target}%`),
    ) : undefined,
    action ? eq(schema.quoteEditorialAuditEvents.action, action) : undefined,
    source ? eq(schema.quoteEditorialAuditEvents.source, source) : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter))

  const events = await db.select({
    ...getTableColumns(schema.quoteEditorialAuditEvents),
    actorAvatarUrl: schema.users.avatarUrl,
  }).from(schema.quoteEditorialAuditEvents)
    .leftJoin(schema.users, eq(schema.quoteEditorialAuditEvents.actorUserId, schema.users.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(order === 'newest' ? desc(schema.quoteEditorialAuditEvents.id) : asc(schema.quoteEditorialAuditEvents.id))
    .limit(limit)
    .all()

  const authorIds = getTargetIds(events, 'author')
  const referenceIds = getTargetIds(events, 'reference')
  const [authors, references] = await Promise.all([
    authorIds.length
      ? db.select({ id: schema.authors.id }).from(schema.authors).where(inArray(schema.authors.id, authorIds)).all()
      : Promise.resolve([]),
    referenceIds.length
      ? db.select({ id: schema.quoteReferences.id }).from(schema.quoteReferences).where(inArray(schema.quoteReferences.id, referenceIds)).all()
      : Promise.resolve([]),
  ])
  const existingTargets = new Set([
    ...authors.map(author => `author:${author.id}`),
    ...references.map(reference => `reference:${reference.id}`),
  ])

  return {
    success: true,
    data: events.map(event => ({
      ...event,
      targetExists: existingTargets.has(`${event.targetType}:${event.targetId}`),
    })),
    next_before_id: order === 'newest' && events.length === limit ? events[events.length - 1]!.id : null,
    next_after_id: order === 'oldest' && events.length === limit ? events[events.length - 1]!.id : null,
    retention: 'indefinite',
  }
})

function getTargetIds(events: Array<{ targetType: string, targetId: string }>, targetType: 'author' | 'reference'): number[] {
  return [...new Set(events
    .filter(event => event.targetType === targetType)
    .map(event => Number(event.targetId))
    .filter(id => Number.isSafeInteger(id) && id > 0))]
}

function readAuditFilter(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().slice(0, 100)
  return normalized || null
}

function parseAuditDate(value: unknown, name: string): string | null {
  if (value === undefined || value === '') return null
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throwServer(400, `Invalid ${name} date`)
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throwServer(400, `Invalid ${name} date`)
  return value
}

function nextUtcDate(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}
