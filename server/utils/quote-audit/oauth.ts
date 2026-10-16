import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

const CREDENTIALS_KEY = 'quote-audit:chatgpt-oauth:v1'
const TOKEN_ENDPOINT = 'https://auth.openai.com/api/accounts/oauth/token'
const RESOURCE = 'https://api.openai.com/v1'
const REQUIRED_SCOPES = ['openid', 'offline_access', 'resource.invoke', 'chatgpt.tokens.use.direct']

export interface QuoteAuditOAuthCredentials {
  clientId: string
  accessToken: string
  refreshToken: string
  idToken: string
  subject: string
  email: string | null
  scopes: string[]
  expiresAt: number
  hostId: string
}

interface QuoteAuditOAuthImport extends QuoteAuditOAuthCredentials {
  nonce: string
  tokenType: string
}

let refreshPromise: Promise<string> | null = null

function getEncryptionSecret() {
  const secret = useRuntimeConfig().session?.password
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new Error('Quote audit OAuth storage requires the configured session encryption secret')
  }
  return secret
}

async function getEncryptionKey() {
  const secret = getEncryptionSecret()
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'HKDF', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new TextEncoder().encode('verbatims-quote-audit-oauth-v1'), info: new TextEncoder().encode('encrypted-worker-credentials') },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function saveCredentials(credentials: QuoteAuditOAuthCredentials) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await getEncryptionKey()
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(credentials)))
  const value = JSON.stringify({ version: 1, iv: bytesToBase64Url(iv), ciphertext: bytesToBase64Url(new Uint8Array(encrypted)) })
  await db.insert(schema.settings)
    .values({ key: CREDENTIALS_KEY, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: new Date() } })
    .run()
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function base64UrlToBytes(value: string) {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}

async function getStoredCredentials(): Promise<QuoteAuditOAuthCredentials | null> {
  const row = await db.select({ value: schema.settings.value }).from(schema.settings).where(eq(schema.settings.key, CREDENTIALS_KEY)).get()
  if (!row) return null

  const encrypted = JSON.parse(row.value) as { version?: number, iv?: string, ciphertext?: string }
  if (encrypted.version !== 1 || !encrypted.iv || !encrypted.ciphertext) throw new Error('Stored quote audit OAuth credentials are invalid')
  const key = await getEncryptionKey()
  const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64UrlToBytes(encrypted.iv) }, key, base64UrlToBytes(encrypted.ciphertext))
  return JSON.parse(new TextDecoder().decode(clear)) as QuoteAuditOAuthCredentials
}

export async function getQuoteAuditOAuthStatus() {
  const credentials = await getStoredCredentials()
  if (!credentials) return { connected: false, email: null, expiresAt: null, model: 'gpt-6-luna', modelAvailable: false, needsReconnect: false }

  try {
    const accessToken = await getQuoteAuditAccessToken()
    const currentCredentials = await getStoredCredentials() || credentials
    const response = await fetch(`${RESOURCE}/models`, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(12_000) })
    if (!response.ok) return { connected: true, email: credentials.email, expiresAt: new Date(currentCredentials.expiresAt).toISOString(), model: 'gpt-6-luna', modelAvailable: false, needsReconnect: response.status === 401 }
    const catalog = await response.json() as { models?: Array<{ slug?: string, visibility?: string }> }
    return { connected: true, email: currentCredentials.email, expiresAt: new Date(currentCredentials.expiresAt).toISOString(), model: 'gpt-6-luna', modelAvailable: Boolean(catalog.models?.some(model => model.slug === 'gpt-6-luna' && model.visibility === 'list')), needsReconnect: false }
  } catch {
    return { connected: true, email: credentials.email, expiresAt: new Date(credentials.expiresAt).toISOString(), model: 'gpt-6-luna', modelAvailable: false, needsReconnect: true }
  }
}

function parseJwtPayload(token: string) {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('OpenAI identity token is malformed')
  const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[1]!))) as Record<string, unknown>
  return { parts, payload }
}

export async function validateQuoteAuditOAuthCredentials(input: unknown): Promise<QuoteAuditOAuthCredentials> {
  if (!input || typeof input !== 'object') throw new Error('OAuth credential bundle is invalid')
  const value = input as Partial<QuoteAuditOAuthImport>
  if (
    typeof value.clientId !== 'string' || !/^oaiapp_/.test(value.clientId)
    || typeof value.accessToken !== 'string' || value.accessToken.length < 20
    || typeof value.refreshToken !== 'string' || value.refreshToken.length < 20
    || typeof value.idToken !== 'string' || typeof value.subject !== 'string'
    || typeof value.expiresAt !== 'number' || !Number.isFinite(value.expiresAt) || value.expiresAt <= Date.now()
    || typeof value.hostId !== 'string' || !value.hostId.startsWith('urn:uuid:')
    || typeof value.nonce !== 'string' || value.nonce.length < 20
    || typeof value.tokenType !== 'string' || value.tokenType.toLowerCase() !== 'bearer'
    || !Array.isArray(value.scopes) || !value.scopes.every(scope => typeof scope === 'string')
  ) throw new Error('OAuth credential bundle is incomplete')

  const missing = REQUIRED_SCOPES.filter(scope => !value.scopes!.includes(scope))
  if (missing.length) throw new Error(`OAuth consent is missing required permissions: ${missing.join(', ')}`)

  const { parts, payload } = parseJwtPayload(value.idToken)
  const header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[0]!))) as { alg?: string, kid?: string }
  if (header.alg !== 'RS256' || !header.kid) throw new Error('OpenAI identity token uses an unsupported signature')

  const configurationResponse = await fetch('https://auth.openai.com/.well-known/openid-configuration')
  if (!configurationResponse.ok) throw new Error('Could not load OpenAI signing configuration')
  const configuration = await configurationResponse.json() as { issuer?: string, jwks_uri?: string }
  if (configuration.issuer !== 'https://auth.openai.com' || !configuration.jwks_uri || new URL(configuration.jwks_uri).origin !== 'https://auth.openai.com') {
    throw new Error('OpenAI signing configuration is not trusted')
  }
  const jwksResponse = await fetch(configuration.jwks_uri)
  if (!jwksResponse.ok) throw new Error('Could not load OpenAI signing keys')
  const jwks = await jwksResponse.json() as { keys?: Array<JsonWebKey & { kid?: string, alg?: string, use?: string }> }
  const jwk = jwks.keys?.find(key => key.kid === header.kid && (!key.alg || key.alg === header.alg) && (!key.use || key.use === 'sig'))
  if (!jwk) throw new Error('OpenAI identity token signing key was not found')
  const publicKey = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
  const signature = base64UrlToBytes(parts[2]!)
  const signedData = new TextEncoder().encode(`${parts[0]!}.${parts[1]!}`)
  if (!await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, signature, signedData)) throw new Error('OpenAI identity token signature is invalid')

  const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
  const now = Math.floor(Date.now() / 1000)
  if (payload.iss !== configuration.issuer || !audience.includes(value.clientId) || typeof payload.sub !== 'string' || !Number.isFinite(Number(payload.exp)) || Number(payload.exp) <= now || !Number.isFinite(Number(payload.iat)) || Number(payload.iat) > now + 5 || payload.nonce !== value.nonce) {
    throw new Error('OpenAI identity token claims do not match this connection')
  }
  if (payload.sub !== value.subject) throw new Error('OAuth account identity does not match its identity token')

  return {
    clientId: value.clientId,
    accessToken: value.accessToken,
    refreshToken: value.refreshToken,
    idToken: value.idToken,
    subject: value.subject,
    email: typeof value.email === 'string' ? value.email : null,
    scopes: value.scopes,
    expiresAt: value.expiresAt,
    hostId: value.hostId,
  }
}

export async function setQuoteAuditOAuthCredentials(input: unknown) {
  const credentials = await validateQuoteAuditOAuthCredentials(input)
  const modelResponse = await fetch(`${RESOURCE}/models`, { headers: { Authorization: `Bearer ${credentials.accessToken}` }, signal: AbortSignal.timeout(15_000) })
  if (!modelResponse.ok) throw new Error(`OpenAI did not accept the connection (${modelResponse.status})`)
  const catalog = await modelResponse.json() as { models?: Array<{ slug?: string, visibility?: string }> }
  const modelAvailable = Boolean(catalog.models?.some(model => model.slug === 'gpt-6-luna' && model.visibility === 'list'))
  await saveCredentials(credentials)
  return { email: credentials.email, model: 'gpt-6-luna', modelAvailable }
}

async function refreshAccessToken(credentials: QuoteAuditOAuthCredentials) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: credentials.clientId,
    refresh_token: credentials.refreshToken,
    resource: RESOURCE,
  })
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) {
    if (response.status === 400) {
      // A different Worker isolate may have rotated and persisted this refresh token concurrently.
      for (const delay of [250, 500, 1000, 2000]) {
        await new Promise(resolve => setTimeout(resolve, delay))
        const latest = await getStoredCredentials()
        if (latest && latest.accessToken !== credentials.accessToken && latest.expiresAt > Date.now() + 60_000) return latest.accessToken
      }
    }
    throw new Error(`ChatGPT OAuth refresh failed (${response.status}); reconnect the account`)
  }
  const token = await response.json() as { access_token?: string, refresh_token?: string, id_token?: string, expires_in?: number, scope?: string }
  if (!token.access_token || !token.refresh_token || !token.expires_in) throw new Error('ChatGPT OAuth refresh response was incomplete')
  const refreshed = {
    ...credentials,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    idToken: token.id_token || credentials.idToken,
    scopes: token.scope ? token.scope.split(/\s+/).filter(Boolean) : credentials.scopes,
    expiresAt: Date.now() + token.expires_in * 1000,
  }
  const missing = REQUIRED_SCOPES.filter(scope => !refreshed.scopes.includes(scope))
  if (missing.length) throw new Error(`Refreshed OAuth session is missing permissions: ${missing.join(', ')}`)
  await saveCredentials(refreshed)
  return refreshed.accessToken
}

export async function getQuoteAuditAccessToken() {
  const credentials = await getStoredCredentials()
  if (!credentials) throw new Error('Connect a ChatGPT session from quote audit settings before running this task')
  if (credentials.expiresAt > Date.now() + 60_000) return credentials.accessToken
  if (!refreshPromise) refreshPromise = refreshAccessToken(credentials).finally(() => { refreshPromise = null })
  return refreshPromise
}

export async function disconnectQuoteAuditOAuth() {
  const credentials = await getStoredCredentials()
  let remoteRevocationConfirmed = false
  if (credentials) {
    try {
      const discovery = await fetch('https://auth.openai.com/.well-known/openid-configuration')
      const config = await discovery.json() as { revocation_endpoint?: string }
      if (config.revocation_endpoint && new URL(config.revocation_endpoint).origin === 'https://auth.openai.com') {
        const response = await fetch(config.revocation_endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ token: credentials.refreshToken, token_type_hint: 'refresh_token', client_id: credentials.clientId }),
          signal: AbortSignal.timeout(10_000),
        })
        remoteRevocationConfirmed = response.ok
      }
    } catch {
      // Local credentials are still removed; the owner can revoke the app in ChatGPT settings.
    }
  }
  await db.delete(schema.settings).where(eq(schema.settings.key, CREDENTIALS_KEY)).run()
  return { remoteRevocationConfirmed }
}
