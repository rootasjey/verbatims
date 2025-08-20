import type { CreateUserMessageInput } from '~/types/report'

const ANON_WINDOW_MINUTES = 10
const ANON_MAX_PER_WINDOW = 3

export default defineEventHandler(async (event) => {
  const db = hubDatabase()
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
    const recentCount = await db.prepare(`
      SELECT COUNT(1) as cnt FROM user_messages
      WHERE ip_address = ? AND created_at > datetime('now', ?)
    `).bind(clientIP, `-${ANON_WINDOW_MINUTES} minutes`).first()

  const count = Number((recentCount as any)?.cnt || 0)
  if (count >= ANON_MAX_PER_WINDOW) {
      return { status: 'ratelimited' as const }
    }

    const duplicate = await db.prepare(`
      SELECT id FROM user_messages
      WHERE ip_address = ? AND message = ? AND created_at > datetime('now', '-5 minutes')
      LIMIT 1
    `).bind(clientIP, message).first()

    if (duplicate) {
      return { status: 'accepted' as const, id: duplicate.id }
    }
  }

  // If content targeted, basic existence check
  if (targetType !== 'general' && targetId) {
    const table = targetType === 'quote' ? 'quotes' : targetType === 'author' ? 'authors' : 'quote_references'
    const exists = await db.prepare(`SELECT id FROM ${table} WHERE id = ? LIMIT 1`).bind(targetId).first()
    if (!exists) {
      throw createError({ statusCode: 404, statusMessage: `${targetType} not found` })
    }
  }

  const result = await db.prepare(`
    INSERT INTO user_messages (user_id, name, email, category, tags, message, target_type, target_id, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId,
    name,
    email,
    category,
    tagsJson,
    message,
    targetType,
    targetId,
    userId ? null : clientIP,
    userAgent
  ).run()

  return { status: 'accepted', id: (result as any).meta?.last_row_id }
})
