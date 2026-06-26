import { trackView, checkEntityExists } from '../../../services/view-tracking.service'

export default defineEventHandler(async (event) => {
  try {
    const authorId = parseIntParam(getRouterParam(event, 'id'))
    if (!authorId) throwServer(400, 'Invalid author ID')

    const session = await getUserSession(event)
    const clientIP = getRequestIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'

    const exists = await checkEntityExists('author', authorId)
    if (!exists) throwServer(404, 'Author not found')

    const { recorded } = await trackView('author', authorId, session.user?.id ?? null, clientIP, userAgent)

    return { success: true, data: { recorded }, message: 'View tracked' }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error tracking author view:', error)
    throwServer(500, 'Failed to track author view')
  }
})
