import { findExistingLike } from '../../../services/like.service'

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) {
      return { success: true, data: { isLiked: false } }
    }

    const quoteId = parseIntParam(getRouterParam(event, 'id'))
    if (!quoteId) throwServer(400, 'Invalid quote ID')

    const like = await findExistingLike('quote', quoteId, session.user.id)

    return { success: true, data: { isLiked: !!like } }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error checking like status:', error)
    throwServer(500, 'Failed to check like status')
  }
})
