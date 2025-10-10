export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const requestUrl = getRequestURL(event)
  const siteUrl = (config.public as any).siteUrl as string
  const styleVersion = (config.public as any).ogStyleVersion as string
  const origin = (siteUrl && siteUrl.length > 0 ? siteUrl : `${requestUrl.protocol}//${requestUrl.host}`).replace(/\/$/, '')

  // Derive a stable hash for caching
  const basis = JSON.stringify({
    t: 'default',
    v: styleVersion || '1'
  })

  const hash = await sha1(basis)
  const kv = hubKV()
  const keyData = 'og:default:latest'
  const keyImage = (h: string) => `og:default:${h}.png`

  // Check cache first
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
  const { page } = await hubBrowser({ keepAlive: 120 })
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 })
  const templateUrl = `${origin}/api/og/templates/default?v=${encodeURIComponent(styleVersion || '1')}`

  // Navigate and wait for fonts to load
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
  for (let i = 0; i < len; i++) binary += String.fromCharCode(u8[i])
  return btoa(binary)
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}