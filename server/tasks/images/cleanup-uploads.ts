import { cleanupAbandonedImageUploads } from '../../utils/image-storage'

const MULTICA_WEBHOOK_URL_KEY = 'MULTICA_R2_WEBHOOK_URL'
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

async function notifyMultica(payload: Record<string, unknown>, runId: string): Promise<void> {
  const webhookUrl = getWorkerSecret(MULTICA_WEBHOOK_URL_KEY)

  if (!webhookUrl) {
    console.warn({
      event: 'image_upload_cleanup_multica_notification_skipped',
      reason: 'not_configured',
      runId,
    })
    return
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(webhookUrl)
  } catch {
    throw new Error('Multica cleanup webhook URL is invalid')
  }

  if (
    parsedUrl.origin !== 'https://multica.ai'
    || parsedUrl.port !== ''
    || parsedUrl.username !== ''
    || parsedUrl.password !== ''
    || parsedUrl.search !== ''
    || parsedUrl.hash !== ''
    || !/^\/api\/webhooks\/autopilots\/[A-Za-z0-9_-]{20,128}$/.test(parsedUrl.pathname)
  ) {
    throw new Error('Multica cleanup webhook URL is not an allowed autopilot trigger')
  }

  const webhookToken = parsedUrl.pathname.split('/').at(-1)!
  const body = JSON.stringify({
    event: String(payload.event ?? 'webhook.received'),
    eventPayload: {
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
          Authorization: `Bearer ${webhookToken}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `image-upload-cleanup:${runId}:${String(payload.event ?? 'report')}`,
        },
        body,
        signal: controller.signal,
      })

      if (response.ok) {
        const result = await response.json() as { status?: unknown }
        if (result.status === 'accepted' || result.status === 'duplicate' || result.status === 'skipped') return
        if (result.status === 'ignored') {
          throw new Error('Multica cleanup webhook ignored the request')
        }
        throw new Error('Multica cleanup webhook returned an unexpected response')
      }

      await response.body?.cancel()
      if (response.status < 500 && response.status !== 429) {
        throw new Error(`Multica cleanup webhook rejected the request (${response.status})`)
      }

      console.warn('Multica cleanup webhook retry', { runId, attempt, status: response.status })
    } catch (error) {
      if (
        error instanceof Error
        && (error.message.startsWith('Multica cleanup webhook rejected')
          || error.message.startsWith('Multica cleanup webhook ignored')
          || error.message.startsWith('Multica cleanup webhook returned'))
      ) {
        throw error
      }

      console.warn('Multica cleanup webhook retry', {
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

  throw new Error(`Multica cleanup webhook delivery failed after ${maxAttempts} attempts (runId: ${runId})`)
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
        await notifyMultica({
          event: 'image_upload_cleanup_failure',
          runId,
          error: errorMessage,
        }, runId)
      } catch {
        console.error('Multica cleanup failure notification failed', { runId })
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
    await notifyMultica({ ...summary }, runId)
    return summary
  },
})
