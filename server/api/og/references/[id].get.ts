import { kv } from 'hub:kv'

export default defineEventHandler(async (event) => {
  let referenceId = getRouterParam(event, 'id')
  if (!referenceId) { throwServer(400, 'Reference id is required'); return }

  if (referenceId.endsWith('.png')) referenceId = referenceId.slice(0, -4)

  const reference = await getReferenceForOg(referenceId)
  if (!reference) { throwServer(404, 'Reference not found'); return }

  const config = useRuntimeConfig()
  const requestUrl = getRequestURL(event)
  const styleVersion = (config.public as any).ogStyleVersion as string
  const origin = `${requestUrl.protocol}//${requestUrl.host}`.replace(/\/$/, '')

  const basis = JSON.stringify({
    n: reference.name,
    t: reference.primaryType,
    s: reference.secondaryType || '',
    d: reference.description || '',
    v: styleVersion || '1',
    u: reference.updatedAt ? Date.parse(reference.updatedAt) : 0
  })

  const hash = await sha1(basis)
  const keyData = `og:reference:${referenceId}:latest`
  const keyImage = (h: string) => `og:reference:${referenceId}:${h}.png`

  const latest = await kv.get<string>(keyData)
  const effectiveHash = latest && latest === hash ? latest : hash

  const cached = await kv.get<string>(keyImage(effectiveHash))
  if (cached) {
    setHeader(event, 'Content-Type', 'image/png')
    setHeader(event, 'ETag', `W/"${effectiveHash}"`)
    setHeader(event, 'Cache-Control', 'public, max-age=2592000')
    return base64ToUint8(cached)
  }

  const { page } = await hubBrowser(event)
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 })
  const templateUrl = `${origin}/api/og/templates/reference?id=${encodeURIComponent(referenceId)}&v=${encodeURIComponent(styleVersion || '1')}`

  await page.goto(templateUrl, { waitUntil: 'networkidle0', timeout: 15000 })
  const png = await page.screenshot({ type: 'png' }) as Buffer

  const b64 = uint8ToBase64(new Uint8Array(png))
  await kv.set(keyImage(hash), b64)

  if (latest && latest !== hash) {
    await kv.del(keyImage(latest))
  }

  await kv.set(keyData, hash)

  setHeader(event, 'Content-Type', 'image/png')
  setHeader(event, 'ETag', `W/"${hash}"`)
  setHeader(event, 'Cache-Control', 'public, max-age=2592000')
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
