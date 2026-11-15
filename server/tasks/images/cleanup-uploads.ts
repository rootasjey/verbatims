import { cleanupAbandonedImageUploads } from '../../utils/image-storage'

const PAPERCLIP_WEBHOOK_URL_KEY = 'PAPERCLIP_R2_WEBHOOK_URL'
const PAPERCLIP_WEBHOOK_SECRET_KEY = 'PAPERCLIP_R2_WEBHOOK_SECRET'
const MAX_REPORTED_CANDIDATE_KEYS = 100

interface CleanupSummary {
  event: 'image_upload_cleanup_summary'
  runId: string
  dryRun: boolean
  scanned: number
  tooRecent: number
  missingTimestamp: number
  referenced: number
  candidateCount: number
  candidateKeys: string[]
  candidateKeysTruncated: boolean
  deleted: number
}

function getWorkerSecret(name: string): string {
  const env = process.env as Record<string, string | undefined>
  const workerEnv = (globalThis as any).__env__ as Record<string, string | undefined> | undefined
  return env[name] || workerEnv?.[name] || ''
}

async function notifyPaperclip(payload: Record<string, unknown>, runId: string): Promise<void> {
  const webhookUrl = getWorkerSecret(PAPERCLIP_WEBHOOK_URL_KEY)
  const webhookSecret = getWorkerSecret(PAPERCLIP_WEBHOOK_SECRET_KEY)

  if (!webhookUrl && !webhookSecret) {
    console.warn({
      event: 'image_upload_cleanup_paperclip_notification_skipped',
      reason: 'not_configured',
      runId,
    })
    return
  }

  if (!webhookUrl || !webhookSecret) {
    throw new Error('Paperclip cleanup webhook configuration is incomplete')
  }

  const parsedUrl = new URL(webhookUrl)
  if (
    parsedUrl.origin !== 'https://paperclip.corpinot.cc'
    || !parsedUrl.pathname.startsWith('/api/routine-triggers/public/')
    || !parsedUrl.pathname.endsWith('/fire')
  ) {
    throw new Error('Paperclip cleanup webhook URL is not an allowed Paperclip trigger')
  }

  const body = JSON.stringify({
    payload: {
      source: 'cloudflare-worker',
      worker: 'verbatims',
      ...payload,
    },
  })
  const maxAttempts = 3

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6_000)

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${webhookSecret}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `image-upload-cleanup:${runId}:${String(payload.event ?? 'report')}`,
        },
        body,
        signal: controller.signal,
      })

      await response.body?.cancel()

      if (response.ok) return
      if (response.status < 500 && response.status !== 429) {
        throw new Error(`Paperclip cleanup webhook rejected the request (${response.status})`)
      }

      console.warn('Paperclip cleanup webhook retry', { runId, attempt, status: response.status })
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Paperclip cleanup webhook rejected')) {
        throw error
      }

      console.warn('Paperclip cleanup webhook retry', {
        runId,
        attempt,
        reason: error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'network_error',
      })
    } finally {
      clearTimeout(timeout)
    }

    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, attempt * 500))
    }
  }

  throw new Error(`Paperclip cleanup webhook delivery failed after ${maxAttempts} attempts (runId: ${runId})`)
}

export default defineTask({
  meta: {
    name: 'images:cleanup-uploads',
    description: 'Report image uploads that are unreferenced and older than 90 days',
  },
  async run() {
    const runId = new Date().toISOString()
    let result: Awaited<ReturnType<typeof cleanupAbandonedImageUploads>>

    try {
      result = await cleanupAbandonedImageUploads({ dryRun: true })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message.slice(0, 300) : 'Unknown cleanup error'
      console.error('Image upload cleanup failed', { runId, error: errorMessage })

      try {
        await notifyPaperclip({
          event: 'image_upload_cleanup_failure',
          runId,
          error: errorMessage,
        }, runId)
      } catch {
        console.error('Paperclip cleanup failure notification failed', { runId })
      }

      throw error
    }

    for (const candidate of result.candidates) {
      console.info({
        event: 'image_upload_cleanup_candidate',
        runId,
        ...candidate,
      })
    }

    const summary: CleanupSummary = {
      event: 'image_upload_cleanup_summary',
      runId,
      dryRun: result.dryRun,
      scanned: result.scanned,
      tooRecent: result.tooRecent,
      missingTimestamp: result.missingTimestamp,
      referenced: result.referenced,
      candidateCount: result.candidates.length,
      candidateKeys: result.candidates.slice(0, MAX_REPORTED_CANDIDATE_KEYS).map(candidate => candidate.key),
      candidateKeysTruncated: result.candidates.length > MAX_REPORTED_CANDIDATE_KEYS,
      deleted: result.deleted,
    }
    console.info(summary)
    await notifyPaperclip({ ...summary }, runId)
    return summary
  },
})
