/**
 * Admin API: Cancel Import
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)
  if (!user || user.role !== 'admin') {
    throwServer(403, 'Admin access required')
  }

  const importId = getRouterParam(event, 'id')!
  if (!importId) {
    throwServer(400, 'Import ID is required')
  }

  const progress = getAdminImport(importId!)
  if (!progress) {
    throwServer(404, 'Import not found')
  }

  requestCancel(importId!)

  return { success: true, message: 'Cancellation requested' }
})

