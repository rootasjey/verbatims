import { db, schema } from 'hub:db'
import { eq, desc, like, and, count } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 50
  const offset = (page - 1) * limit
  const search = query.search as string | undefined

  const conditions = [eq(schema.apiKeys.userId, user.id)]
  if (search) conditions.push(like(schema.apiKeys.name, `%${search}%`))

  const where = and(...conditions)

  const totalResult = await db
    .select({ total: count() })
    .from(schema.apiKeys)
    .where(where)
    .get()

  const total = totalResult?.total || 0

  const apiKeys = await db
    .select({
      id: schema.apiKeys.id,
      name: schema.apiKeys.name,
      keyPrefix: schema.apiKeys.keyPrefix,
      permissions: schema.apiKeys.permissions,
      rateLimit: schema.apiKeys.rateLimit,
      windowSec: schema.apiKeys.windowSec,
      isActive: schema.apiKeys.isActive,
      lastUsedAt: schema.apiKeys.lastUsedAt,
      expiresAt: schema.apiKeys.expiresAt,
      tier: schema.apiKeys.tier,
      createdAt: schema.apiKeys.createdAt,
      updatedAt: schema.apiKeys.updatedAt,
    })
    .from(schema.apiKeys)
    .where(where)
    .orderBy(desc(schema.apiKeys.createdAt))
    .limit(limit)
    .offset(offset)
    .all()

  return {
    success: true,
    data: apiKeys.map(k => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      permissions: JSON.parse(k.permissions || '["read"]'),
      tier: k.tier,
      rateLimit: k.rateLimit,
      windowSec: k.windowSec,
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt,
      expiresAt: k.expiresAt,
      createdAt: k.createdAt,
      updatedAt: k.updatedAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  }
})
