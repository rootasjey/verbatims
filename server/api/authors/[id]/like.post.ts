import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const authorId = getRouterParam(event, 'id')
    if (!authorId || isNaN(parseInt(authorId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid author ID'
      })
    }

    // Check if author exists
    const author = await db.select({ id: schema.authors.id })
      .from(schema.authors)
      .where(eq(schema.authors.id, parseInt(authorId)))
      .get()

    if (!author) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Author not found'
      })
    }

    // Check if user has already liked this author
    const existingLike = await db.select({ id: schema.userLikes.id })
      .from(schema.userLikes)
      .where(and(
        eq(schema.userLikes.userId, session.user.id),
        eq(schema.userLikes.likeableType, 'author'),
        eq(schema.userLikes.likeableId, parseInt(authorId))
      ))
      .get()

    let isLiked = false

    if (existingLike) {
      // Unlike - remove the like
      await db.delete(schema.userLikes)
        .where(and(
          eq(schema.userLikes.userId, session.user.id),
          eq(schema.userLikes.likeableType, 'author'),
          eq(schema.userLikes.likeableId, parseInt(authorId))
        ))
      
      isLiked = false
    } else {
      // Like - add the like
      await db.insert(schema.userLikes).values({
        userId: session.user.id,
        likeableType: 'author',
        likeableId: parseInt(authorId)
      })
      
      isLiked = true
    }

    // Get updated like count
    const updatedAuthor = await db.select({ likesCount: schema.authors.likesCount })
      .from(schema.authors)
      .where(eq(schema.authors.id, parseInt(authorId)))
      .get()

    if (!updatedAuthor) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch updated author'
      })
    }

    return {
      success: true,
      data: {
        isLiked,
        likesCount: updatedAuthor.likesCount
      }
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Error toggling author like:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to toggle like'
    })
  }
})
