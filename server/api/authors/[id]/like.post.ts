import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) {
      throwServer(401, 'Authentication required')
    }

    const authorId = getRouterParam(event, 'id')
    if (!authorId || isNaN(parseInt(authorId))) {
      throwServer(400, 'Invalid author ID')
    }

    // Check if author exists
    const author = await db.select({ id: schema.authors.id })
      .from(schema.authors)
      .where(eq(schema.authors.id, parseInt(authorId)))
      .get()

    if (!author) {
      throwServer(404, 'Author not found')
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
      throwServer(500, 'Failed to fetch updated author')
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
    throwServer(500, 'Failed to toggle like')
  }
})
