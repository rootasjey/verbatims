import { db } from 'hub:db'

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
