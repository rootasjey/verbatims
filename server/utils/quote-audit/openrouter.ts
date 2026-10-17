import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

const CREDENTIALS_KEY = 'quote-audit:openrouter-key:v1'
const OPENROUTER_API = 'https://openrouter.ai/api/v1'
export const QUOTE_AUDIT_MODEL = 'openai/gpt-5-nano'

function getEncryptionSecret() {
  const secret = useRuntimeConfig().session?.password
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new Error('Quote audit OpenRouter key storage requires the configured session encryption secret')
  }
  return secret
}

async function getEncryptionKey() {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(getEncryptionSecret()), 'HKDF', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new TextEncoder().encode('verbatims-quote-audit-openrouter-v1'), info: new TextEncoder().encode('encrypted-worker-credentials') },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
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

async function saveApiKey(apiKey: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await getEncryptionKey()
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(apiKey))
  const value = JSON.stringify({ version: 1, iv: bytesToBase64Url(iv), ciphertext: bytesToBase64Url(new Uint8Array(encrypted)) })
  await db.insert(schema.settings)
    .values({ key: CREDENTIALS_KEY, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: new Date() } })
    .run()
}

async function getStoredApiKey(): Promise<string | null> {
  const row = await db.select({ value: schema.settings.value }).from(schema.settings).where(eq(schema.settings.key, CREDENTIALS_KEY)).get()
  if (!row) return null

  const encrypted = JSON.parse(row.value) as { version?: number, iv?: string, ciphertext?: string }
  if (encrypted.version !== 1 || !encrypted.iv || !encrypted.ciphertext) throw new Error('Stored quote audit OpenRouter credentials are invalid')
  const key = await getEncryptionKey()
  const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64UrlToBytes(encrypted.iv) }, key, base64UrlToBytes(encrypted.ciphertext))
  return new TextDecoder().decode(clear)
}

async function validateApiKey(apiKey: string) {
  const response = await fetch(`${OPENROUTER_API}/key`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(12_000),
  })
  if (response.status === 401 || response.status === 403) throw new Error('OpenRouter rejected this API key')
  if (!response.ok) throw new Error(`OpenRouter key check failed (${response.status})`)

  const modelResponse = await fetch(`${OPENROUTER_API}/models/openai/gpt-5-nano/endpoints`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(12_000),
  })
  if (modelResponse.status === 404) throw new Error('The configured OpenRouter model is unavailable')
  if (!modelResponse.ok) throw new Error(`OpenRouter model check failed (${modelResponse.status})`)
  const model = await modelResponse.json() as { data?: { endpoints?: unknown[] } }
  if (!model.data?.endpoints?.length) throw new Error('The configured OpenRouter model is unavailable')
}

export async function setQuoteAuditOpenRouterKey(input: unknown) {
  if (typeof input !== 'string' || input.length < 20 || input.length > 500 || /\s/.test(input)) {
    throw new Error('Enter a valid OpenRouter API key')
  }
  await validateApiKey(input)
  await saveApiKey(input)
  return { configured: true, model: QUOTE_AUDIT_MODEL }
}

export async function getQuoteAuditOpenRouterKey() {
  const apiKey = await getStoredApiKey()
  if (!apiKey) throw new Error('Configure an OpenRouter API key before running the quote audit')
  return apiKey
}

export async function getQuoteAuditOpenRouterStatus() {
  const apiKey = await getStoredApiKey()
  if (!apiKey) return { configured: false, valid: false, model: QUOTE_AUDIT_MODEL, modelAvailable: false }

  try {
    await validateApiKey(apiKey)
    return { configured: true, valid: true, model: QUOTE_AUDIT_MODEL, modelAvailable: true }
  } catch (error) {
    return {
      configured: true,
      valid: false,
      model: QUOTE_AUDIT_MODEL,
      modelAvailable: false,
      status: error instanceof Error && error.message === 'OpenRouter rejected this API key'
        ? 'rejected'
        : error instanceof Error && error.message === 'The configured OpenRouter model is unavailable'
          ? 'model_unavailable'
          : 'unavailable',
    }
  }
}

export async function deleteQuoteAuditOpenRouterKey() {
  await db.delete(schema.settings).where(eq(schema.settings.key, CREDENTIALS_KEY)).run()
  return { configured: false }
}
