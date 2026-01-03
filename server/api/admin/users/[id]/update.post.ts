import { db, schema } from 'hub:db'
import { eq, count, sum, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication and admin privileges
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }
    
    if (session.user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }
    
    const userId = getRouterParam(event, 'id')
    if (!userId || isNaN(parseInt(userId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid user ID'
      })
    }
    
    const userIdInt = parseInt(userId)
    const body = await readBody(event)
    
    // Check if user exists
    const existingUser = await db.select()
      .from(schema.users)
      .where(eq(schema.users.id, userIdInt))
      .limit(1)
    
    if (!existingUser || existingUser.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }
    
    const user = existingUser[0]
    
    // Prevent admin from modifying their own role or status
    if (userIdInt === session.user.id) {
      if (body.role !== undefined && body.role !== user.role) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Cannot modify your own role'
        })
      }
      
      if (body.is_active !== undefined && !body.is_active) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Cannot deactivate your own account'
        })
      }
    }
    
    // Build update object
    const updates: any = {}
    
    if (body.role !== undefined && ['user', 'moderator', 'admin'].includes(body.role)) {
      updates.role = body.role
    }
    
    if (body.is_active !== undefined) {
      updates.isActive = body.is_active
    }
    
    if (body.email_verified !== undefined) {
      updates.emailVerified = body.email_verified
    }
    
    if (Object.keys(updates).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No valid fields to update'
      })
    }
    
    // Update user
    await db.update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, userIdInt))
    
    // Get updated user with statistics
    const updatedUserResult = await db.select({
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
    .where(eq(schema.users.id, userIdInt))
    .groupBy(schema.users.id)
    
    return {
      success: true,
      data: updatedUserResult[0],
      message: 'User updated successfully'
    }
  } catch (error) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('User update error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update user'
    })
  }
})
