import { blob } from 'hub:blob'

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')
  if (!pathname) {
    throwServer(400, 'Missing pathname')
  }

  const file = await blob.get(pathname)
  if (!file) {
    throwServer(404, 'File not found')
  }

  const arrayBuffer = await file.arrayBuffer()

  setHeader(event, 'Content-Type', file.type || 'application/octet-stream')
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

  return new Response(arrayBuffer, {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
})
