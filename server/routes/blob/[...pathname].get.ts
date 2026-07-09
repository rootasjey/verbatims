import { blob } from 'hub:blob'

const PROD_ORIGIN = 'https://verbatims.cc'

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')!
  if (!pathname) {
    throwServer(400, 'Missing pathname')
  }

  let file = await blob.get(pathname)
  if (!file && import.meta.dev) {
    file = await fetchFromProd(pathname)
  }
  if (!file) throwServer(404, 'File not found')

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

async function fetchFromProd(pathname: string): Promise<Blob | null> {
  try {
    const res = await fetch(`${PROD_ORIGIN}/blob/${pathname}`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null

    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'application/octet-stream'
    await blob.put(pathname, buffer, {
      contentType,
      addRandomSuffix: false,
    })
    return new Blob([buffer], { type: contentType })
  } catch {
    return null
  }
}
