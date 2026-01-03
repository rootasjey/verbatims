import { db, schema } from 'hub:db'
import { like, eq, and, or, desc, asc, sql, count } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const session = await getUserSession(event)
    
    // Parse query parameters
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const offset = (page - 1) * limit
    const search = query.search as string || ''
    const userId = query.user_id as string
    const publicOnly = query.public === 'true'
    const sort = query.sort as string || 'updatedAt'
    const order = query.order as string || 'desc'
    
    // Build WHERE conditions
    const whereConditions = []
    
    if (search) {
      whereConditions.push(or(like(schema.userCollections.name, `%${search}%`), like(schema.userCollections.description, `%${search}%`)))
    }
    
    if (userId) {
      whereConditions.push(eq(schema.userCollections.userId, parseInt(userId)))
    }
    
    if (publicOnly) {
      whereConditions.push(eq(schema.userCollections.isPublic, true))
    } else if (!session.user) {
      whereConditions.push(eq(schema.userCollections.isPublic, true))
    } else if (!userId) {
      whereConditions.push(or(eq(schema.userCollections.isPublic, true), eq(schema.userCollections.userId, session.user.id)))
    }

    // Map sort column
    const sortCol = sort === 'created_at' ? schema.userCollections.createdAt : 
                    sort === 'name' ? schema.userCollections.name :
                    schema.userCollections.updatedAt

    const quotesCountSq = sql<number>`(SELECT COUNT(*) FROM collection_quotes WHERE collection_id = ${schema.userCollections.id})`

    let queryBuilder = db.select({
      id: schema.userCollections.id,
      name: schema.userCollections.name,
      description: schema.userCollections.description,
      isPublic: schema.userCollections.isPublic,
      userId: schema.userCollections.userId,
      createdAt: schema.userCollections.createdAt,
      updatedAt: schema.userCollections.updatedAt,
      userName: schema.users.name,
      userAvatar: schema.users.avatarUrl,
      quotesCount: quotesCountSq
    })
    .from(schema.userCollections)
    .leftJoin(schema.users, eq(schema.userCollections.userId, schema.users.id))
    .$dynamic()

    if (whereConditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...whereConditions))
    }

    if (sort === 'quotes_count') {
      queryBuilder = queryBuilder.orderBy(order === 'asc' ? asc(quotesCountSq) : desc(quotesCountSq))
    } else {
      queryBuilder = queryBuilder.orderBy(order === 'asc' ? asc(sortCol) : desc(sortCol))
    }

    const results = await queryBuilder.limit(limit).offset(offset)

    // Get total count
    const [totalResult] = await db.select({ count: count() })
      .from(schema.userCollections)
      .where(and(...whereConditions))

    return {
      success: true,
      data: results,
      pagination: {
        page,
        limit,
        total: totalResult?.count || 0,
        pages: Math.ceil((totalResult?.count || 0) / limit)
      }
    }
  } catch (error) {
    console.error('Collections fetch error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch collections'
    })
  }
})
