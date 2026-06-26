import { trackView, checkEntityExists } from '../../../services/view-tracking.service'

export default defineEventHandler(async (event) => {
  try {
    const refId = parseIntParam(getRouterParam(event, 'id'))
    if (!refId) throwServer(400, 'Invalid reference ID')

    const session = await getUserSession(event)
    const clientIP = getRequestIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'

    const exists = await checkEntityExists('reference', refId)
    if (!exists) throwServer(404, 'Reference not found')

    const { recorded } = await trackView('reference', refId, session.user?.id ?? null, clientIP, userAgent)

    return { success: true, message: 'View tracked', recorded }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error tracking reference view:', error)
    throwServer(500, 'Failed to track reference view')
  }
})
