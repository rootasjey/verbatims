import { cleanupAbandonedImageUploads } from '../../utils/image-storage'

export default defineTask({
  meta: {
    name: 'images:cleanup-uploads',
    description: 'Report image uploads that are unreferenced and older than 90 days',
  },
  async run() {
    const result = await cleanupAbandonedImageUploads({ dryRun: true })
    const runId = new Date().toISOString()

    for (const candidate of result.candidates) {
      console.info({
        event: 'image_upload_cleanup_candidate',
        runId,
        ...candidate,
      })
    }

    const summary = {
      event: 'image_upload_cleanup_summary',
      runId,
      dryRun: result.dryRun,
      scanned: result.scanned,
      tooRecent: result.tooRecent,
      missingTimestamp: result.missingTimestamp,
      referenced: result.referenced,
      candidateCount: result.candidates.length,
      deleted: result.deleted,
    }
    console.info(summary)
    return summary
  },
})
