import { db, schema } from 'hub:db'
import { eq, desc, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }
    
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const page = parseInt(query.page as string) || 1
    const offset = (page - 1) * limit
    
    // Get user's recent activity (likes, collections, submissions)
    const activities: Array<Record<string, any>> = []

    const qa = alias(schema.authors, 'qa')
    
    // Recent likes - using SQL CASE for conditional fields
    const recentLikes = await db.select({
      created_at: schema.userLikes.createdAt,
      likeable_type: schema.userLikes.likeableType,
      likeable_id: schema.userLikes.likeableId,
      item_name: sql<string>`CASE 
        WHEN ${schema.userLikes.likeableType} = 'quote' THEN ${schema.quotes.name}
        WHEN ${schema.userLikes.likeableType} = 'author' THEN ${schema.authors.name}
        WHEN ${schema.userLikes.likeableType} = 'reference' THEN ${schema.quoteReferences.name}
      END`,
      author_name: sql<string>`CASE 
        WHEN ${schema.userLikes.likeableType} = 'quote' THEN ${qa.name}
        ELSE NULL
      END`
    })
      .from(schema.userLikes)
      .leftJoin(schema.quotes, sql`${schema.userLikes.likeableType} = 'quote' AND ${schema.userLikes.likeableId} = ${schema.quotes.id}`)
      .leftJoin(schema.authors, sql`${schema.userLikes.likeableType} = 'author' AND ${schema.userLikes.likeableId} = ${schema.authors.id}`)
      .leftJoin(schema.quoteReferences, sql`${schema.userLikes.likeableType} = 'reference' AND ${schema.userLikes.likeableId} = ${schema.quoteReferences.id}`)
      .leftJoin(qa, eq(schema.quotes.authorId, qa.id))
      .where(eq(schema.userLikes.userId, session.user.id))
      .orderBy(desc(schema.userLikes.createdAt))
      .limit(10)
    
    recentLikes.forEach((like: any) => {
      activities.push({
        type: 'like',
        action: `Liked ${like.likeable_type}`,
        item_name: like.item_name,
        author_name: like.author_name,
        item_type: like.likeable_type,
        item_id: like.likeable_id,
        created_at: like.created_at
      })
    })
    
    // Recent collection updates
    const recentCollections = await db.select({
      id: schema.userCollections.id,
      name: schema.userCollections.name,
      created_at: schema.userCollections.createdAt,
      updated_at: schema.userCollections.updatedAt
    })
      .from(schema.userCollections)
      .where(eq(schema.userCollections.userId, session.user.id))
      .orderBy(desc(schema.userCollections.createdAt))
      .limit(10)
    
    recentCollections.forEach((collection: any) => {
      activities.push({
        type: 'collection',
        action: 'Created collection',
        item_name: collection.name,
        item_type: 'collection',
        item_id: collection.id,
        created_at: collection.created_at
      })
    })
    
    // Recent quote submissions
    const recentSubmissions = await db.select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      status: schema.quotes.status,
      created_at: schema.quotes.createdAt,
      author_name: schema.authors.name
    })
      .from(schema.quotes)
      .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
      .where(eq(schema.quotes.userId, session.user.id))
      .orderBy(desc(schema.quotes.createdAt))
      .limit(10)
    
    recentSubmissions.forEach((submission: any) => {
      activities.push({
        type: 'submission',
        action: `Submitted quote (${submission.status})`,
        item_name: submission.name,
        author_name: submission.author_name,
        item_type: 'quote',
        item_id: submission.id,
        status: submission.status,
        created_at: submission.created_at
      })
    })
    
    // Sort all activities by date and limit
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const paginatedActivities = activities.slice(offset, offset + limit)
    
    return {
      success: true,
      data: paginatedActivities,
      pagination: {
        page,
        limit,
        total: activities.length,
        hasMore: offset + limit < activities.length,
        totalPages: Math.ceil(activities.length / limit)
      }
    }
  } catch (error) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Dashboard activity error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch user activity'
    })
  }
})
