import { db, schema } from 'hub:db'
import { eq, and, gt, count, sql } from 'drizzle-orm'

const ANON_WINDOW_MINUTES = 10
const ANON_MAX_PER_WINDOW = 3

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const clientIP = getRequestIP(event) || 'unknown'
  const userAgent = getHeader(event, 'user-agent') || 'unknown'

  const body = await readBody<CreateUserMessageInput>(event)

  // Basic validation
  if (!body || !body.category || !body.message || body.message.trim().length < 10) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }

  // Normalize optional fields
  const category = body.category
  const message = body.message.trim().slice(0, 4000)
  const tagsJson = JSON.stringify(body.tags || [])
  const targetType = body.target_type || 'general'
  const targetId = body.target_id ?? null

  // For anonymous users, require at least one of name/email and rate limit by IP
  const userId = session.user?.id ?? null
  const name = userId ? null : (body.name?.trim() || null)
  const email = userId ? null : (body.email?.trim() || null)

  if (!userId && !name && !email) {
    throw createError({ statusCode: 400, statusMessage: 'Anonymous reports must include a name or email' })
  }

  // Anti-flood for anonymous: limit N per window per IP, and dedupe exact repeats in 5 minutes
  if (!userId) {
    const [recentCount] = await db.select({ cnt: count() })
      .from(schema.userMessages)
      .where(and(
        eq(schema.userMessages.ipAddress, clientIP),
        gt(schema.userMessages.createdAt, sql`datetime('now', ${`-${ANON_WINDOW_MINUTES} minutes`})`)
      ))

    const messageCount = Number(recentCount?.cnt || 0)
    if (messageCount >= ANON_MAX_PER_WINDOW) {
      return { status: 'ratelimited' as const }
    }

    const [duplicate] = await db.select({ id: schema.userMessages.id })
      .from(schema.userMessages)
      .where(and(
        eq(schema.userMessages.ipAddress, clientIP),
        eq(schema.userMessages.message, message),
        gt(schema.userMessages.createdAt, sql`datetime('now', '-5 minutes')`)
      ))
      .limit(1)

    if (duplicate) {
      return { status: 'accepted' as const, id: duplicate.id }
    }
  }

  // If content targeted, basic existence check
  if (targetType !== 'general' && targetId) {
    let exists
    if (targetType === 'quote') {
      [exists] = await db.select({ id: schema.quotes.id }).from(schema.quotes).where(eq(schema.quotes.id, targetId)).limit(1)
    } else if (targetType === 'author') {
      [exists] = await db.select({ id: schema.authors.id }).from(schema.authors).where(eq(schema.authors.id, targetId)).limit(1)
    } else {
      [exists] = await db.select({ id: schema.quoteReferences.id }).from(schema.quoteReferences).where(eq(schema.quoteReferences.id, targetId)).limit(1)
    }

    if (!exists) {
      throw createError({ statusCode: 404, statusMessage: `${targetType} not found` })
    }
  }

  const [result] = await db.insert(schema.userMessages).values({
    userId,
    name,
    email,
    category,
    tags: tagsJson,
    message,
    targetType,
    targetId,
    ipAddress: userId ? null : clientIP,
    userAgent
  }).returning({ id: schema.userMessages.id })

  return { status: 'accepted', id: result.id }
})
