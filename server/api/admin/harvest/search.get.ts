import { getHarvestAdapter } from '../../../utils/harvest/index'
import { isHarvestSourceType, type HarvestSourceType } from '#shared/constants/harvest'

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) throwServer(401, 'Authentication required')
  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    throwServer(403, 'Admin or moderator access required')
  }

  const query = getQuery(event)
  const sourceType = String(query.sourceType || '') as HarvestSourceType
  const searchQuery = String(query.query || '')
  const limit = Math.min(Number(query.limit) || 20, 50)

  if (!isHarvestSourceType(sourceType)) {
    throwServer(400, `Invalid source type: ${sourceType}. Valid types: wikiquote-fr, wikiquote-en, quotable`)
  }

  if (!searchQuery.trim()) {
    throwServer(400, 'Search query is required')
  }

  const adapter = getHarvestAdapter(sourceType)
  const results = await adapter.search(searchQuery, limit)

  return { success: true, data: results }
})