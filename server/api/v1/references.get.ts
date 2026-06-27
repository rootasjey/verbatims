import { db, schema } from 'hub:db'
import { eq, desc, sql, count, like } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = Math.min(parseInt(query.limit as string) || 20, 100)
  const offset = (page - 1) * limit
  const search = query.search as string | undefined
  const type = query.type as string | undefined

  const conditions = []
  if (search) conditions.push(like(schema.quoteReferences.name, `%${search}%`))
  if (type) conditions.push(eq(schema.quoteReferences.primaryType, type as any))

  const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined

  const totalResult = await db
    .select({ total: count() })
    .from(schema.quoteReferences)
    .where(where)
    .get()

  const total = totalResult?.total || 0

  const references = await db
    .select({
      id: schema.quoteReferences.id,
      name: schema.quoteReferences.name,
      primaryType: schema.quoteReferences.primaryType,
      secondaryType: schema.quoteReferences.secondaryType,
      imageUrl: schema.quoteReferences.imageUrl,
      releaseDate: schema.quoteReferences.releaseDate,
      originalLanguage: schema.quoteReferences.originalLanguage,
      description: schema.quoteReferences.description,
      viewsCount: schema.quoteReferences.viewsCount,
      likesCount: schema.quoteReferences.likesCount,
      createdAt: schema.quoteReferences.createdAt,
    })
    .from(schema.quoteReferences)
    .where(where)
    .orderBy(desc(schema.quoteReferences.viewsCount))
    .limit(limit)
    .offset(offset)
    .all()

  return {
    success: true,
    data: references.map(r => ({
      id: r.id,
      name: r.name,
      type: r.primaryType,
      secondary_type: r.secondaryType,
      image_url: r.imageUrl,
      release_date: r.releaseDate,
      language: r.originalLanguage,
      description: r.description,
      stats: { views: r.viewsCount, likes: r.likesCount },
      created_at: r.createdAt,
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
