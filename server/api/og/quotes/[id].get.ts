import { getApprovedQuoteForOg } from '~/server/utils/og'
import { kv } from 'hub:kv'
import puppeteer from '@cloudflare/puppeteer'

export default defineEventHandler(async (event) => {
  let quoteId = getRouterParam(event, 'id')
  if (!quoteId) { throwServer(400, 'Quote id is required'); return }

  // Accept optional .png suffix for nicer URLs in social meta
  if (quoteId.endsWith('.png')) quoteId = quoteId.slice(0, -4)

  const quote = await getApprovedQuoteForOg(quoteId)
  if (!quote) { throwServer(404, 'Quote not found'); return }

  const config = useRuntimeConfig()
  const requestUrl = getRequestURL(event)
  const siteUrl = (config.public as any).siteUrl as string
  const styleVersion = (config.public as any).ogStyleVersion as string
  const origin = (siteUrl && siteUrl.length > 0 ? siteUrl : `${requestUrl.protocol}//${requestUrl.host}`).replace(/\/$/, '')

  // Derive a stable hash from content + style to invalidate when needed
  const basis = JSON.stringify({
    t: quote.text,
    a: quote.authorName || '',
    r: quote.referenceName || '',
    v: styleVersion || '1',
    u: quote.updatedAt ? Date.parse(quote.updatedAt) : 0
  })
  const hash = await sha1(basis)

  const keyData = `og:quote:${quoteId}:latest`
  const keyImage = (h: string) => `og:quote:${quoteId}:${h}.png`

  // If latest hash matches and image exists, serve from KV
  const latest = await kv.get<string>(keyData)
  const effectiveHash = latest && latest === hash ? latest : hash

  const cached = await kv.get<string>(keyImage(effectiveHash))
  if (cached) {
    setHeader(event, 'Content-Type', 'image/png')
    setHeader(event, 'ETag', `W/"${effectiveHash}"`)
    setHeader(event, 'Cache-Control', 'public, max-age=2592000') // 30 days
    return base64ToUint8(cached)
  }

  // Render using Cloudflare Browser Rendering (Puppeteer)
  const browser = await puppeteer.launch(process.env.BROWSER)
  const page = await browser.newPage()
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 })
  const templateUrl = `${origin}/api/og/templates/quote?id=${encodeURIComponent(quoteId)}&v=${encodeURIComponent(styleVersion || '1')}`

  // Navigate and wait for fonts to load (dom + network idle enough for our minimal page)
  await page.goto(templateUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
  const png = await page.screenshot({ type: 'png' }) as Buffer

  // Store in KV for future hits
  const b64 = uint8ToBase64(new Uint8Array(png))
  await kv.set(keyImage(hash), b64)
  
  // Clean up old image if hash changed
  if (latest && latest !== hash) {
    await kv.del(keyImage(latest))
  }
  
  await kv.set(keyData, hash)

  await browser.close()

  setHeader(event, 'Content-Type', 'image/png')
  setHeader(event, 'ETag', `W/"${hash}"`)
  setHeader(event, 'Cache-Control', 'public, max-age=2592000') // 30 days
  return png
})

async function sha1(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-1', data)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function uint8ToBase64(u8: Uint8Array): string {
  let binary = ''
  const len = u8.byteLength
  for (let i = 0; i < len; i++) binary += String.fromCharCode(u8[i] ?? 0)
  return btoa(binary)
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}