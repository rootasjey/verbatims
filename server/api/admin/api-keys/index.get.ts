import { db, schema } from 'hub:db'
import { eq, desc, like, and, sql, count } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 50
  const offset = (page - 1) * limit
  const search = query.search as string | undefined

  const whereConditions = []
  if (search) {
    whereConditions.push(like(schema.apiKeys.name, `%${search}%`))
  }

  const where = whereConditions.length > 0 ? and(...whereConditions) : undefined

  const totalResult = await db
    .select({ total: count() })
    .from(schema.apiKeys)
    .where(where)
    .get()

  const total = totalResult?.total || 0

  const apiKeys = await db
    .select({
      id: schema.apiKeys.id,
      userId: schema.apiKeys.userId,
      name: schema.apiKeys.name,
      keyPrefix: schema.apiKeys.keyPrefix,
      permissions: schema.apiKeys.permissions,
      tier: schema.apiKeys.tier,
      readRateLimit: schema.apiKeys.readRateLimit,
      readWindowSec: schema.apiKeys.readWindowSec,
      isActive: schema.apiKeys.isActive,
      lastUsedAt: schema.apiKeys.lastUsedAt,
      expiresAt: schema.apiKeys.expiresAt,
      createdAt: schema.apiKeys.createdAt,
      updatedAt: schema.apiKeys.updatedAt,
      userName: schema.users.name,
    })
    .from(schema.apiKeys)
    .innerJoin(schema.users, eq(schema.apiKeys.userId, schema.users.id))
    .where(where)
    .orderBy(desc(schema.apiKeys.createdAt))
    .limit(limit)
    .offset(offset)
    .all()

  return {
    success: true,
    data: {
      apiKeys: apiKeys.map(k => ({
        id: k.id,
        userId: k.userId,
        name: k.name,
        keyPrefix: k.keyPrefix,
        tier: k.tier,
        permissions: JSON.parse(k.permissions || '["read"]'),
        readRateLimit: k.readRateLimit,
        readWindowSec: k.readWindowSec,
        isActive: k.isActive,
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
        createdAt: k.createdAt,
        updatedAt: k.updatedAt,
        userName: k.userName,
      })),
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  }
})
