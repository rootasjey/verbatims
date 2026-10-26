import { kv } from 'hub:kv'
import type { H3Event } from 'h3'
import { getTagForOg } from '~~/server/utils/og'

export default defineEventHandler(async (event) => {
  let tagId = getRouterParam(event, 'id')
  if (!tagId) {
    throwServer(400, 'Tag id is required')
    return
  }

  if (tagId.endsWith('.png')) tagId = tagId.slice(0, -4)

  const tag = await getTagForOg(tagId)
  if (!tag) {
    throwServer(404, 'Tag not found')
    return
  }

  const config = useRuntimeConfig()
  const requestUrl = getRequestURL(event)
  const origin = `${requestUrl.protocol}//${requestUrl.host}`.replace(/\/$/, '')
  const styleVersion = `${String(config.public.ogStyleVersion || '1')}:tag-count-v1`
  const hash = await sha1(JSON.stringify({
    name: tag.name,
    color: tag.color || '',
    quoteCount: tag.quoteCount,
    updatedAt: tag.updatedAt ? Date.parse(tag.updatedAt) : 0,
    styleVersion,
  }))

  const latestKey = `og:tag:${tagId}:latest`
  const imageKey = (imageHash: string) => `og:tag:${tagId}:${imageHash}.png`
  const latestHash = await kv.get<string>(latestKey)
  const cachedImage = await kv.get<string>(imageKey(latestHash === hash ? latestHash : hash))

  if (cachedImage) {
    setImageHeaders(event, hash)
    return base64ToUint8(cachedImage)
  }

  const { page } = await hubBrowser(event)
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 })
  await page.goto(
    `${origin}/api/og/templates/tag?id=${encodeURIComponent(tagId)}&v=${encodeURIComponent(styleVersion)}`,
    { waitUntil: 'networkidle0', timeout: 15000 }
  )

  const png = await page.screenshot({ type: 'png' }) as Buffer
  await kv.set(imageKey(hash), uint8ToBase64(new Uint8Array(png)))

  if (latestHash && latestHash !== hash) {
    await kv.del(imageKey(latestHash))
  }

  await kv.set(latestKey, hash)
  setImageHeaders(event, hash)
  return png
})

function setImageHeaders(event: H3Event, hash: string): void {
  setHeader(event, 'Content-Type', 'image/png')
  setHeader(event, 'ETag', `W/"${hash}"`)
  setHeader(event, 'Cache-Control', 'public, max-age=86400')
}

async function sha1(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}
