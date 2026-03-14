import { processEnrichmentJobs } from '../../utils/enrichment/processor'
import { resolveEnrichmentConfig } from '../../utils/enrichment/config'

export default defineTask({
  meta: {
    name: 'enrichment:process',
    description: 'Process queued enrichment jobs and build preview proposals.'
  },
  async run() {
    const config = await resolveEnrichmentConfig()

    if (!config.values.processEnabled) {
      return {
        success: true,
        skipped: true,
        reason: 'data enrichment processing disabled'
      }
    }

    return await processEnrichmentJobs({ limit: config.values.processBatchSize })
  }
})