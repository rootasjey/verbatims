import { findExistingLike } from '../../../services/like.service'

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) {
      return { success: true, data: { isLiked: false } }
    }

    const authorId = parseIntParam(getRouterParam(event, 'id'))
    if (!authorId) throwServer(400, 'Invalid author ID')

    const like = await findExistingLike('author', authorId, session.user.id)

    return { success: true, data: { isLiked: !!like } }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error checking author like status:', error)
    throwServer(500, 'Failed to check like status')
  }
})
