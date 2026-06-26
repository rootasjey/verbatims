import { getAvailableSourceTypes } from '../../../utils/harvest/index'
import { HARVEST_SOURCE_LABELS, HARVEST_SOURCE_LANGUAGES } from '#shared/constants/harvest'
import { isHarvestSourceType } from '#shared/constants/harvest'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)
  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    throwServer(403, 'Admin or moderator access required')
  }

  const sources = getAvailableSourceTypes().map(type => ({
    type,
    label: HARVEST_SOURCE_LABELS[type],
    language: HARVEST_SOURCE_LANGUAGES[type],
  }))

  return { success: true, data: sources }
})