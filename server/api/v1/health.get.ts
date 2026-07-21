import { db } from 'hub:db'

defineRouteMeta({
  openAPI: {
    summary: 'Health check',
    description: 'Public endpoint to verify API availability and database connectivity.',
    tags: ['System'],
    responses: {
      '200': {
        description: 'API is healthy',
        content: {
          'application/json': {
            example: { success: true, data: { status: 'healthy', database: 'ok', response_time_ms: 12, timestamp: '2025-01-01T00:00:00Z' } },
          },
        },
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  const start = Date.now()

  let dbStatus: 'ok' | 'error' = 'ok'
  try {
    if (db) {
      await db.run('SELECT 1')
    } else {
      dbStatus = 'error'
    }
  } catch {
    dbStatus = 'error'
  }

  const responseTime = Date.now() - start
  const statusCode = dbStatus === 'ok' ? 200 : 503
  setResponseStatus(event, statusCode)

  return {
    success: dbStatus === 'ok',
    data: {
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      database: dbStatus,
      response_time_ms: responseTime,
      timestamp: new Date().toISOString(),
    },
  }
})
