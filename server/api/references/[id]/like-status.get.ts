import { findExistingLike } from '../../../services/like.service'

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) {
      return { success: true, data: { isLiked: false } }
    }

    const refId = parseIntParam(getRouterParam(event, 'id'))
    if (!refId) throwServer(400, 'Invalid reference ID')

    const like = await findExistingLike('reference', refId, session.user.id)

    return { success: true, data: { isLiked: !!like } }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error checking reference like status:', error)
    throwServer(500, 'Failed to check like status')
  }
})
