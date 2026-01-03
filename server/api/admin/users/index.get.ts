import { db, schema } from 'hub:db'
import { eq, and, or, count, sum, sql, desc, like } from 'drizzle-orm'

export default defineEventHandler(async (event): Promise<AdminUsersApiResponse> => {
  try {
    const session = await requireUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }
    
    if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin or moderator access required'
      })
    }
    
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const offset = (page - 1) * limit
    const search = query.search as string || ''
    const role = query.role as string
    const status = query.status as string
    
    // Build WHERE conditions
    const conditions = []
    
    if (search) {
      conditions.push(
        or(
          like(schema.users.name, `%${search}%`),
          like(schema.users.email, `%${search}%`)
        )
      )
    }
    
    if (role && ['user', 'moderator', 'admin'].includes(role)) {
      conditions.push(eq(schema.users.role, role as any))
    }
    
    if (status === 'active') {
      conditions.push(eq(schema.users.isActive, true))
    } else if (status === 'inactive') {
      conditions.push(eq(schema.users.isActive, false))
    }
    
    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined
    
    // Get users with their statistics
    const usersResult = await db.select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      password: schema.users.password,
      avatarUrl: schema.users.avatarUrl,
      role: schema.users.role,
      isActive: schema.users.isActive,
      emailVerified: schema.users.emailVerified,
      biography: schema.users.biography,
      job: schema.users.job,
      language: schema.users.language,
      location: schema.users.location,
      socials: schema.users.socials,
      lastLoginAt: schema.users.lastLoginAt,
      createdAt: schema.users.createdAt,
      updatedAt: schema.users.updatedAt,
      quote_count: sql<number>`COUNT(DISTINCT ${schema.quotes.id})`.as('quote_count'),
      approved_quotes: sql<number>`COUNT(DISTINCT CASE WHEN ${schema.quotes.status} = 'approved' THEN ${schema.quotes.id} END)`.as('approved_quotes'),
      collection_count: sql<number>`COUNT(DISTINCT ${schema.userCollections.id})`.as('collection_count'),
      likes_given: sql<number>`COUNT(DISTINCT ${schema.userLikes.id})`.as('likes_given'),
      total_likes_received: sql<number>`COALESCE(SUM(${schema.quotes.likesCount}), 0)`.as('total_likes_received')
    })
    .from(schema.users)
    .leftJoin(schema.quotes, eq(schema.users.id, schema.quotes.userId))
    .leftJoin(schema.userCollections, eq(schema.users.id, schema.userCollections.userId))
    .leftJoin(schema.userLikes, eq(schema.users.id, schema.userLikes.userId))
    .where(whereCondition)
    .groupBy(schema.users.id)
    .orderBy(desc(schema.users.createdAt))
    .limit(limit)
    .offset(offset)
    
    // Get total count
    const totalResult = await db.select({ total: count() })
      .from(schema.users)
      .where(whereCondition)

    const userCount = usersResult.length
    const total = Number(totalResult[0]?.total) || 0
    const hasMore = offset + userCount < total
    
    // Remove sensitive information for non-admin users
    const processedUsers: AdminUser[] = usersResult.map((user: any) => {
      const userData: any = { ...user }
      
      // Only admins can see email addresses
      if (session.user.role !== 'admin') {
        delete userData.email
      }
      
      return userData
    })
    
    return {
      success: true,
      data: processedUsers,
      pagination: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Admin users error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch users'
    })
  }
})
