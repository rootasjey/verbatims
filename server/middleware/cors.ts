const v1ApiPattern = '/api/v1/'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

export default defineEventHandler(async (event) => {
  const path = event.path || event.node.req.url || ''

  if (!path.startsWith(v1ApiPattern)) return

  if (event.method === 'OPTIONS') {
    for (const [key, value] of Object.entries(corsHeaders)) {
      setHeader(event, key, value)
    }
    event.node.res.statusCode = 204
    event.node.res.end()
    return
  }

  for (const [key, value] of Object.entries(corsHeaders)) {
    setHeader(event, key, value)
  }
})
