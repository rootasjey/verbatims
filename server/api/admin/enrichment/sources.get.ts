import { checkEnrichmentSources } from '../../../utils/enrichment/sources'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return { success: true, data: await checkEnrichmentSources() }
})
