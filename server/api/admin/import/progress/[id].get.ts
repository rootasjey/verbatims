/**
 * Admin API: Get Import Progress (SSE + JSON fallback)
 */
function formatSSE(event: string, data: any) {
  return `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`
}

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!user || user.role !== 'admin') {
    throwServer(403, 'Admin access required')
  }

  const importId = getRouterParam(event, 'id')
  if (!importId) {
    throwServer(400, 'Import ID is required')
  }

  const progress = getAdminImport(importId)
  if (!progress) {
    throwServer(404, 'Import not found')
  }

  const accept = getHeader(event, 'accept') || ''
  const wantsSSE = accept.includes('text/event-stream')

  if (!wantsSSE) {
    const derived = computeDerived(progress)
    return {
      success: true,
      data: {
        ...progress,
        ...derived,
        errorCount: progress.errors.length,
        warningCount: progress.warnings.length,
        recentErrors: progress.errors.slice(-5),
        recentWarnings: progress.warnings.slice(-5),
      }
    }
  }

  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')

  let heartbeat: any
  const stream = new ReadableStream({
    start(controller) {
      try {
        const encoder = new TextEncoder()
        const initial = { ...progress, ...computeDerived(progress) }
        controller.enqueue(encoder.encode(formatSSE('progress', initial)))

        const unsubscribe = onProgress(importId, (updated) => {
          try {
            const payload = { ...updated, ...computeDerived(updated) }
            controller.enqueue(encoder.encode(formatSSE('progress', payload)))
            if (updated.status === 'completed' || updated.status === 'failed') {
              setTimeout(() => {
                controller.enqueue(encoder.encode(formatSSE('close', { reason: updated.status })))
                controller.close()
                unsubscribe()
                clearInterval(heartbeat)
              }, 500)
            }
          } catch (e) {
            console.error('SSE enqueue failed:', e)
          }
        })

        heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(formatSSE('heartbeat', { ts: Date.now() })))
          } catch (e) {
            clearInterval(heartbeat)
          }
        }, 30000)
      } catch (e) {
        console.error('SSE start failed:', e)
      }
    }
  })

  return stream
})
