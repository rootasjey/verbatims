const MAX_IMAGE_CHECK_ATTEMPTS = 2
const IMAGE_CHECK_RETRY_DELAY_MS = 300

export async function fetchImagePayload(imageUrl: string): Promise<{ bytes: ArrayBuffer, contentType: string }> {
  const internalPath = getInternalImagePath(imageUrl)
  let internalError: string | null = null

  if (internalPath) {
    try {
      const internalResponse = await fetch(new URL(internalPath, imageUrl))
      if (internalResponse.ok) {
        return {
          bytes: await internalResponse.arrayBuffer(),
          contentType: internalResponse.headers.get('content-type') || 'image/png'
        }
      }

      internalError = await getResponseError(internalResponse)
    } catch (error) {
      internalError = error instanceof Error ? error.message : String(error)
    }
  }

  const imageResponse = await fetch(imageUrl)

  if (!imageResponse.ok) {
    const externalError = await getResponseError(imageResponse)
    const internalSuffix = internalError ? `; internal request: ${internalError}` : ''
    throw new Error(`Failed to fetch image from ${getSafeImageUrl(imageUrl)} (${externalError}${internalSuffix})`)
  }

  return {
    bytes: await imageResponse.arrayBuffer(),
    contentType: imageResponse.headers.get('content-type') || 'image/png'
  }
}

async function getResponseError(response: Response): Promise<string> {
  const details = await response.text().catch(() => '')
  return details ? `${response.status}: ${details.slice(0, 240)}` : String(response.status)
}

export async function ensureRemoteImageReady(imageUrl: string, platformLabel: string): Promise<void> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_IMAGE_CHECK_ATTEMPTS; attempt++) {
    try {
      const { contentType } = await fetchImagePayload(imageUrl)
      const normalizedContentType = contentType.split(';')[0]?.trim().toLowerCase() || ''

      if (normalizedContentType.startsWith('image/')) return

      lastError = new Error(`${platformLabel} media URL did not return an image (${normalizedContentType || 'unknown content type'})`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
    }

    if (attempt < MAX_IMAGE_CHECK_ATTEMPTS) {
      await delay(IMAGE_CHECK_RETRY_DELAY_MS)
    }
  }

  throw lastError || new Error(`${platformLabel} media URL could not be checked`)
}

function getInternalImagePath(imageUrl: string): string | null {
  try {
    const runtimeConfig = useRuntimeConfig()
    const parsed = new URL(imageUrl)
    const normalizedOrigin = parsed.origin.replace(/\/$/, '')
    const knownOrigins = new Set(
      [
        String(runtimeConfig.public.siteUrl || ''),
        String(runtimeConfig.public.authUrl || '')
      ]
        .map(value => value.trim().replace(/\/$/, ''))
        .filter(Boolean)
    )
    const hostname = parsed.hostname.toLowerCase()
    const isLocalHost = hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname === '::1'
      || hostname.endsWith('.local')
    const isKnownOrigin = knownOrigins.has(normalizedOrigin)
    if (!isLocalHost && !isKnownOrigin) return null
    const pathname = parsed.pathname || ''
    const isKnownImageEndpoint = pathname.startsWith('/api/social/images/') || pathname.startsWith('/api/og/')
    if (!isKnownImageEndpoint) return null
    return `${pathname}${parsed.search || ''}`
  } catch {
    return null
  }
}

function getSafeImageUrl(imageUrl: string): string {
  try {
    const parsed = new URL(imageUrl)
    return `${parsed.origin}${parsed.pathname}`
  } catch {
    return 'provided image URL'
  }
}

async function delay(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms))
}
