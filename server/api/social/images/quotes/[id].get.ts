import { kv } from 'hub:kv'

export default defineEventHandler(async (event) => {
  let quoteId = getRouterParam(event, 'id')
  if (!quoteId) { throwServer(400, 'Quote id is required'); return }

  let outputFormat: 'png' | 'jpeg' = 'png'
  let contentType = 'image/png'

  if (quoteId.endsWith('.jpg') || quoteId.endsWith('.jpeg')) {
    outputFormat = 'jpeg'
    contentType = 'image/jpeg'
    quoteId = quoteId.replace(/\.(jpg|jpeg)$/i, '')
  } else if (quoteId.endsWith('.png')) {
    quoteId = quoteId.slice(0, -4)
  }

  const quote = await getApprovedQuoteForOg(quoteId)
  if (!quote) { throwServer(404, 'Quote not found'); return }

  const config = useRuntimeConfig()
  const requestUrl = getRequestURL(event)
  const styleVersion = `${(config.public as any).ogStyleVersion || '1'}:square-v1`
  const origin = `${requestUrl.protocol}//${requestUrl.host}`.replace(/\/$/, '')

  const basis = JSON.stringify({
    t: quote.text,
    a: quote.authorName || '',
    r: quote.referenceName || '',
    v: styleVersion,
    u: quote.updatedAt ? Date.parse(quote.updatedAt) : 0
  })
  const hash = await sha1(basis)

  const keyData = `social:quote:${quoteId}:latest`
  const keyImage = (h: string) => `social:quote:${quoteId}:${h}.${outputFormat === 'jpeg' ? 'jpg' : 'png'}`

  const latest = await kv.get<string>(keyData)
  const effectiveHash = latest && latest === hash ? latest : hash

  const cached = await kv.get<string>(keyImage(effectiveHash))
  if (cached) {
    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'ETag', `W/"${effectiveHash}"`)
    setHeader(event, 'Cache-Control', 'public, max-age=2592000')
    return base64ToUint8(cached)
  }

  const { page } = await hubBrowser(event)
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 })

  const templateUrl = `${origin}/api/social/images/templates/quote?id=${encodeURIComponent(quoteId)}&v=${encodeURIComponent(styleVersion)}`
  await page.goto(templateUrl, { waitUntil: 'networkidle0', timeout: 15000 })
  const image = await page.screenshot(
    outputFormat === 'jpeg'
      ? { type: 'jpeg', quality: 90 }
      : { type: 'png' }
  ) as Buffer

  const b64 = uint8ToBase64(new Uint8Array(image))
  await kv.set(keyImage(hash), b64)

  if (latest && latest !== hash) {
    await kv.del(keyImage(latest))
  }

  await kv.set(keyData, hash)

  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'ETag', `W/"${hash}"`)
  setHeader(event, 'Cache-Control', 'public, max-age=2592000')

  return image
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