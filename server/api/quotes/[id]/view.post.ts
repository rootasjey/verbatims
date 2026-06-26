import { trackView, checkEntityExists } from '../../../services/view-tracking.service'

export default defineEventHandler(async (event) => {
  try {
    const quoteId = parseIntParam(getRouterParam(event, 'id'))
    if (!quoteId) throwServer(400, 'Invalid quote ID')

    const session = await getUserSession(event)
    const clientIP = getRequestIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'

    const exists = await checkEntityExists('quote', quoteId, true)
    if (!exists) throwServer(404, 'Quote not found or not approved')

    const { recorded } = await trackView('quote', quoteId, session.user?.id ?? null, clientIP, userAgent)

    return { success: true, data: { recorded }, message: 'View tracked' }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error tracking view:', error)
    throwServer(500, 'Failed to track view')
  }
})
