import { kv } from 'hub:kv'
import type { H3Event } from 'h3'
import { getCollectionOgPreview } from '~~/server/utils/og-collection'

export default defineEventHandler(async (event) => {
  const rawId = getRouterParam(event, 'id')?.replace(/\.png$/, '')
  const id = Number(rawId)
  if (!Number.isSafeInteger(id) || id < 1) throwServer(400, 'Invalid list ID')

  const preview = await getCollectionOgPreview(id)
  if (!preview) throwServer(404, 'List not found')

  const config = useRuntimeConfig()
  const version = String(config.public.ogStyleVersion || '1')
  const locale = getQuery(event).locale === 'fr' ? 'fr' : 'en'
  const hash = await sha1(JSON.stringify({ ...preview, locale, version }))
  const latestKey = `og:collection:${id}:${locale}:latest`
  const imageKey = `og:collection:${id}:${locale}:${hash}.png`
  const latest = await kv.get<string>(latestKey)
  const cached = await kv.get<string>(imageKey)
  if (cached) {
    setImageHeaders(event, hash)
    return base64ToUint8(cached)
  }

  const origin = getRequestURL(event).origin
  const templateUrl = new URL('/api/og/templates/collection', origin)
  templateUrl.searchParams.set('id', String(id))
  templateUrl.searchParams.set('locale', locale)
  const { page } = await hubBrowser(event)
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 })
  await page.goto(templateUrl.toString(), { waitUntil: 'networkidle0', timeout: 15000 })
  const png = await page.screenshot({ type: 'png' }) as Buffer
  await kv.set(imageKey, uint8ToBase64(new Uint8Array(png)))
  if (latest && latest !== hash) await kv.del(`og:collection:${id}:${locale}:${latest}.png`)
  await kv.set(latestKey, hash)
  setImageHeaders(event, hash)
  return png
})

function setImageHeaders(event: H3Event, hash: string): void {
  setHeader(event, 'Content-Type', 'image/png')
  setHeader(event, 'ETag', `W/"${hash}"`)
  setHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=600')
}

async function sha1(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToUint8(value: string): Uint8Array {
  const binary = atob(value)
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}
