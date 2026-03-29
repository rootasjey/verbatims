import { scheduleVerificationJobs, getEnrichmentPolicy } from '../../utils/enrichment/scheduler'

export default defineTask({
  meta: {
    name: 'enrichment:schedule',
    description: 'Scan authors and references, then enqueue due verification jobs into the enrichment queue.'
  },
  async run() {
    const policy = await getEnrichmentPolicy()

    if (!policy.cronEnabled) {
      return {
        success: true,
        skipped: true,
        reason: 'data verification cron disabled'
      }
    }

    return await scheduleVerificationJobs({
      entityTypes: ['author', 'reference'],
      triggeredBy: 'cron',
      limitPerType: policy.batchSize,
    })
  }
})