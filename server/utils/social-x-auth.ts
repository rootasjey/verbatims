type XAuthMode = 'none' | 'oauth2-user' | 'oauth1'

export interface XAuthConfig {
  mode: XAuthMode
  oauth2AccessToken?: string
  oauth1ConsumerKey?: string
  oauth1ConsumerSecret?: string
  oauth1AccessToken?: string
  oauth1AccessTokenSecret?: string
  legacyBearerTokenProvided?: boolean
}

export function getXAuthConfig(input?: {
  oauth2AccessToken?: string
  oauth1ConsumerKey?: string
  oauth1ConsumerSecret?: string
  oauth1AccessToken?: string
  oauth1AccessTokenSecret?: string
}): XAuthConfig {
  const oauth1ConsumerKey = String(input?.oauth1ConsumerKey || '').trim()
  const oauth1ConsumerSecret = String(input?.oauth1ConsumerSecret || '').trim()
  const oauth1AccessToken = String(input?.oauth1AccessToken || '').trim()
  const oauth1AccessTokenSecret = String(input?.oauth1AccessTokenSecret || '').trim()

  const hasOauth1 = Boolean(oauth1ConsumerKey && oauth1ConsumerSecret && oauth1AccessToken && oauth1AccessTokenSecret)
  if (hasOauth1) {
    return {
      mode: 'oauth1',
      oauth1ConsumerKey,
      oauth1ConsumerSecret,
      oauth1AccessToken,
      oauth1AccessTokenSecret
    }
  }

  const oauth2AccessToken = String(input?.oauth2AccessToken || '').trim()

  if (oauth2AccessToken) {
    return {
      mode: 'oauth2-user',
      oauth2AccessToken,
      legacyBearerTokenProvided: false
    }
  }

  return { mode: 'none' }
}

export function getXAuthConfigFromEnv(): XAuthConfig {
  return getXAuthConfig({
    oauth2AccessToken: String(
      process.env.NUXT_X_POST_ACCESS_TOKEN
        || process.env.NUXT_X_POST_BEARER_TOKEN
        || ''
    ),
    oauth1ConsumerKey: String(process.env.NUXT_X_POST_OAUTH1_CONSUMER_KEY || ''),
    oauth1ConsumerSecret: String(process.env.NUXT_X_POST_OAUTH1_CONSUMER_SECRET || ''),
    oauth1AccessToken: String(process.env.NUXT_X_POST_OAUTH1_ACCESS_TOKEN || ''),
    oauth1AccessTokenSecret: String(process.env.NUXT_X_POST_OAUTH1_ACCESS_TOKEN_SECRET || '')
  })
}

export function getXCredentialErrorMessage() {
  return 'Missing X credentials: set NUXT_X_POST_ACCESS_TOKEN (OAuth 2.0 User Context) or all NUXT_X_POST_OAUTH1_* variables'
}

export function isXUserContextAuthError(message: string): boolean {
  return /application-only|oauth 2\.0 application-only|supported authentication types|user context/i.test(message)
}

export function withXUserContextHint(message: string): string {
  if (!isXUserContextAuthError(message)) return message
  return `${message}. Use OAuth 2.0 User Context token in NUXT_X_POST_ACCESS_TOKEN, or OAuth 1.0a via NUXT_X_POST_OAUTH1_* variables.`
}

export async function buildXAuthHeaders(input: {
  method: string
  url: string
  auth: XAuthConfig
}): Promise<Record<string, string>> {
  if (input.auth.mode === 'oauth2-user' && input.auth.oauth2AccessToken) {
    return {
      Authorization: `Bearer ${input.auth.oauth2AccessToken}`
    }
  }

  if (
    input.auth.mode === 'oauth1'
    && input.auth.oauth1ConsumerKey
    && input.auth.oauth1ConsumerSecret
    && input.auth.oauth1AccessToken
    && input.auth.oauth1AccessTokenSecret
  ) {
    const authorization = await createOAuth1AuthorizationHeader({
      method: input.method,
      url: input.url,
      consumerKey: input.auth.oauth1ConsumerKey,
      consumerSecret: input.auth.oauth1ConsumerSecret,
      accessToken: input.auth.oauth1AccessToken,
      accessTokenSecret: input.auth.oauth1AccessTokenSecret
    })

    return {
      Authorization: authorization
    }
  }

  return {}
}

async function createOAuth1AuthorizationHeader(input: {
  method: string
  url: string
  consumerKey: string
  consumerSecret: string
  accessToken: string
  accessTokenSecret: string
}): Promise<string> {
  const parsedUrl = new URL(input.url)
  const oauthParams: Array<[string, string]> = [
    ['oauth_consumer_key', input.consumerKey],
    ['oauth_nonce', generateNonce()],
    ['oauth_signature_method', 'HMAC-SHA1'],
    ['oauth_timestamp', Math.floor(Date.now() / 1000).toString()],
    ['oauth_token', input.accessToken],
    ['oauth_version', '1.0']
  ]

  const allParams: Array<[string, string]> = [...oauthParams]
  parsedUrl.searchParams.forEach((value, key) => {
    allParams.push([key, value])
  })

  const normalizedParams = allParams
    .map(([key, value]) => [percentEncode(key), percentEncode(value)] as [string, string])
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      if (leftKey < rightKey) return -1
      if (leftKey > rightKey) return 1
      if (leftValue < rightValue) return -1
      if (leftValue > rightValue) return 1
      return 0
    })
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  const baseString = [
    input.method.toUpperCase(),
    percentEncode(getBaseUrl(parsedUrl)),
    percentEncode(normalizedParams)
  ].join('&')

  const signingKey = `${percentEncode(input.consumerSecret)}&${percentEncode(input.accessTokenSecret)}`
  const signature = await signHmacSha1(signingKey, baseString)

  const headerParams = [...oauthParams, ['oauth_signature', signature]]
    .map(([key, value]) => `${percentEncode(key)}="${percentEncode(value)}"`)
    .join(', ')

  return `OAuth ${headerParams}`
}

function getBaseUrl(url: URL): string {
  const protocol = url.protocol.toLowerCase()
  const hostname = url.hostname.toLowerCase()
  const port = url.port
  const isDefaultPort = (protocol === 'https:' && (port === '' || port === '443')) || (protocol === 'http:' && (port === '' || port === '80'))
  const normalizedPort = isDefaultPort ? '' : `:${port}`

  return `${protocol}//${hostname}${normalizedPort}${url.pathname}`
}

function percentEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
}

function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

async function signHmacSha1(key: string, text: string): Promise<string> {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(text))
  return toBase64(signature)
}

function toBase64(signature: ArrayBuffer): string {
  const bytes = new Uint8Array(signature)
  const BufferImpl = (globalThis as any).Buffer
  if (BufferImpl) {
    return BufferImpl.from(bytes).toString('base64')
  }

  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}