import { getHarvestAdapter } from '../../../utils/harvest/index'
import { isHarvestSourceType } from '#shared/constants/harvest'
import type { HarvestSourceType } from '#shared/constants/harvest'

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) throwServer(401, 'Authentication required')
  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    throwServer(403, 'Admin or moderator access required')
  }

  const query = getQuery(event)
  const sourceType = String(query.sourceType || '') as HarvestSourceType

  if (!isHarvestSourceType(sourceType)) {
    throwServer(400, `Invalid source type: ${sourceType}`)
  }

  const adapter = getHarvestAdapter(sourceType)
  const suggestions = await adapter.getSuggestions(30)

  return { success: true, data: suggestions }
})