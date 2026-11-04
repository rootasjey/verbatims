import { and, desc, eq, gte, like, lt, or } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const requestedLimit = Number(query.limit ?? 50)
  const beforeId = query.before_id === undefined ? undefined : Number(query.before_id)
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1) throwServer(400, 'Invalid limit')
  if (beforeId !== undefined && (!Number.isInteger(beforeId) || beforeId < 1)) throwServer(400, 'Invalid before_id')
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
    beforeId ? lt(schema.quoteEditorialAuditEvents.id, beforeId) : undefined,
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

  const events = await db.select().from(schema.quoteEditorialAuditEvents)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(schema.quoteEditorialAuditEvents.id))
    .limit(limit)
    .all()

  return {
    success: true,
    data: events,
    next_before_id: events.length === limit ? events[events.length - 1]!.id : null,
    retention: 'indefinite',
  }
})

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
