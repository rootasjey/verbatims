import { db, schema } from 'hub:db'
import { eq, and, or, count, sql, asc, desc, like } from 'drizzle-orm'

export default defineEventHandler(async (event): Promise<AdminUsersApiResponse> => {
  try {
    return await handleAdminUsersList(event)
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Admin users error:', error)
    throwServer(500, 'Failed to fetch users')
  }
})

async function handleAdminUsersList(event: any): Promise<AdminUsersApiResponse> {
    const { user } = await requireModerator(event)
    
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const offset = (page - 1) * limit
    const search = query.search as string || ''
    const role = query.role as string
    const status = query.status as string
    const sortBy = query.sort_by as string || 'created_at'
    const sortOrder = String(query.sort_order || '').toUpperCase() === 'ASC' ? asc : desc

    const sortColumnMap = {
      quote_count: sql.raw('quote_count'),
      collection_count: sql.raw('collection_count'),
      created_at: schema.users.createdAt,
      last_login_at: schema.users.lastLoginAt,
    }
    const sortColumn = sortColumnMap[sortBy as keyof typeof sortColumnMap] || schema.users.createdAt
    
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
    .orderBy(sortOrder(sortColumn), asc(schema.users.id))
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
    const processedUsers: AdminUser[] = usersResult.map((user: any) => ({
      id: user.id,
      name: user.name,
      ...(user.role === 'admin' && user.email ? { email: user.email } : {}),
      avatar_url: user.avatarUrl,
      role: user.role,
      is_active: user.isActive,
      email_verified: user.emailVerified,
      biography: user.biography,
      job: user.job,
      language: user.language,
      location: user.location,
      socials: user.socials,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      last_login_at: user.lastLoginAt ?? undefined,
      quote_count: user.quote_count,
      approved_quotes: user.approved_quotes,
      collection_count: user.collection_count,
      likes_given: user.likes_given,
      total_likes_received: user.total_likes_received,
    }))
    
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
  }

