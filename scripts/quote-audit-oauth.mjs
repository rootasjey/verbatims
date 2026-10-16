#!/usr/bin/env node
import { createHash, createPublicKey, randomBytes, randomUUID, verify } from 'node:crypto'
import { createServer } from 'node:http'
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'

const AUTHORIZE_URL = 'https://auth.openai.com/api/accounts/authorize'
const TOKEN_URL = 'https://auth.openai.com/api/accounts/oauth/token'
const OIDC_URL = 'https://auth.openai.com/.well-known/openid-configuration'
const RESOURCE = 'https://api.openai.com/v1'
const REQUIRED_SCOPES = ['openid', 'offline_access', 'resource.invoke', 'chatgpt.tokens.use.direct']
const PORT = 1455
const configDir = join(homedir(), '.config', 'verbatims-quote-audit')
const configPath = join(configDir, 'oauth-client.json')
const allowedOrigins = new Set(['https://verbatims.cc', 'http://localhost:3002', 'http://127.0.0.1:3002'])

function b64url(value) { return Buffer.from(value).toString('base64url') }
function sendHtml(response, body, status = 200) {
  response.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' })
  response.end(body)
}

function writeCredentialCors(response, origin) {
  response.setHeader('Access-Control-Allow-Origin', origin)
  response.setHeader('Access-Control-Allow-Private-Network', 'true')
  response.setHeader('Vary', 'Origin')
}

async function loadConfig() {
  try { return JSON.parse(await readFile(configPath, 'utf8')) }
  catch { return {} }
}

async function persistConfig(next) {
  await mkdir(configDir, { recursive: true, mode: 0o700 })
  await writeFile(configPath, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 })
  await chmod(configPath, 0o600)
}

async function exchangeCode(clientId, code, verifier, redirectUri) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', client_id: clientId, code, code_verifier: verifier, redirect_uri: redirectUri, resource: RESOURCE }),
    signal: AbortSignal.timeout(15_000),
  })
  const token = await response.json()
  if (!response.ok) throw new Error(`OpenAI token exchange failed (${response.status})`)
  if (!token.access_token || !token.refresh_token || !token.id_token || !token.expires_in || token.token_type?.toLowerCase() !== 'bearer') throw new Error('OpenAI returned an incomplete OAuth response')
  const scopes = String(token.scope || '').split(/\s+/).filter(Boolean)
  if (REQUIRED_SCOPES.some(scope => !scopes.includes(scope))) throw new Error('The OAuth consent did not grant all required permissions')
  return { token, scopes }
}

async function verifyIdentity(idToken, clientId, nonce) {
  const parts = idToken.split('.')
  if (parts.length !== 3) throw new Error('OpenAI identity token is malformed')
  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'))
  const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
  if (header.alg !== 'RS256' || !header.kid) throw new Error('OpenAI identity token signature algorithm is unsupported')
  const discoveryResponse = await fetch(OIDC_URL)
  if (!discoveryResponse.ok) throw new Error('Could not load OpenAI identity configuration')
  const discovery = await discoveryResponse.json()
  if (discovery.issuer !== 'https://auth.openai.com' || new URL(discovery.jwks_uri).origin !== 'https://auth.openai.com') throw new Error('OpenAI identity configuration is not trusted')
  const keysResponse = await fetch(discovery.jwks_uri)
  if (!keysResponse.ok) throw new Error('Could not load OpenAI identity signing keys')
  const keys = await keysResponse.json()
  const jwk = keys.keys?.find(key => key.kid === header.kid && (!key.alg || key.alg === header.alg) && (!key.use || key.use === 'sig'))
  if (!jwk) throw new Error('OpenAI identity signing key was not found')
  const publicKey = createPublicKey({ key: jwk, format: 'jwk' })
  if (!verify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), publicKey, Buffer.from(parts[2], 'base64url'))) throw new Error('OpenAI identity token signature is invalid')
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
  if (claims.iss !== discovery.issuer || !audience.includes(clientId) || claims.nonce !== nonce || !claims.sub || claims.exp <= Date.now() / 1000) throw new Error('OpenAI identity token claims do not match this sign-in')
  return claims
}

const flows = new Map()
let pendingCredential = null
const config = await loadConfig()
const hostId = config.hostId || `urn:uuid:${randomUUID()}`
await persistConfig({ ...config, hostId })

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://127.0.0.1:${PORT}`)
  if (url.pathname === '/health' && request.method === 'OPTIONS') {
    const origin = request.headers.origin
    if (!origin || !allowedOrigins.has(origin)) return response.writeHead(403).end()
    writeCredentialCors(response, origin)
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    return response.writeHead(204).end()
  }

  if (url.pathname === '/health' && request.method === 'GET') {
    const origin = request.headers.origin
    if (!origin || !allowedOrigins.has(origin)) return response.writeHead(403).end()
    writeCredentialCors(response, origin)
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
    return response.end(JSON.stringify({ ready: true }))
  }

  if (url.pathname === '/credentials' && request.method === 'OPTIONS') {
    const origin = request.headers.origin
    if (!origin || !allowedOrigins.has(origin)) return response.writeHead(403).end()
    writeCredentialCors(response, origin)
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'content-type')
    return response.writeHead(204).end()
  }

  if (url.pathname === '/credentials' && request.method === 'GET') {
    const origin = request.headers.origin
    if (!origin || !allowedOrigins.has(origin)) return response.writeHead(403).end()
    writeCredentialCors(response, origin)
    response.setHeader('Cache-Control', 'no-store')
    if (!pendingCredential || pendingCredential.origin !== origin) {
      return response.writeHead(204).end()
    }
    const result = pendingCredential
    pendingCredential = null
    response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    })
    return response.end(JSON.stringify(result.credentials ? { credentials: result.credentials } : { error: result.error }))
  }

  if (url.pathname === '/connect') {
    const origin = url.searchParams.get('origin')
    if (!origin || !allowedOrigins.has(origin)) return sendHtml(response, 'Origin is not allowed. Use verbatims.cc or local port 3002.', 403)
    const state = b64url(randomBytes(32))
    const nonce = b64url(randomBytes(32))
    const verifier = b64url(randomBytes(48))
    const challenge = b64url(createHash('sha256').update(verifier).digest())
    const flow = { state, nonce, verifier, origin, hostId, config }
    flows.set(state, flow)
    const authorize = new URL(AUTHORIZE_URL)
    authorize.search = new URLSearchParams({
      client_id: config.clientId || 'dynamic_agent_client',
      ...(!config.clientId ? { agent_name_hint: 'Verbatims Quote Audit' } : {}),
      ext_agent_host_id: hostId,
      ...(config.email ? { login_hint: config.email } : {}),
      response_type: 'code',
      redirect_uri: `http://127.0.0.1:${PORT}/auth/callback`,
      scope: 'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct',
      resource: RESOURCE,
      state,
      nonce,
      code_challenge_method: 'S256',
      code_challenge: challenge,
    }).toString()
    response.writeHead(302, { Location: authorize.toString(), 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' })
    return response.end()
  }

  if (url.pathname === '/auth/callback') {
    const state = url.searchParams.get('state') || ''
    const flow = flows.get(state)
    flows.delete(state)
    if (!flow) return sendHtml(response, 'OAuth state expired or did not match. Close this tab and retry from Verbatims.', 400)
    if (url.searchParams.has('error')) {
      pendingCredential = { origin: flow.origin, error: url.searchParams.get('error') === 'access_denied' ? 'ChatGPT sign-in was denied.' : 'ChatGPT sign-in was cancelled.' }
      return sendHtml(response, 'ChatGPT sign-in was cancelled or denied. You can close this window.', 400)
    }
    const code = url.searchParams.get('code')
    const issuedClientId = flow.config.clientId || url.searchParams.get('client_id')
    if (!code || !issuedClientId || url.searchParams.get('client_id') && url.searchParams.get('client_id') !== issuedClientId) return sendHtml(response, 'OpenAI did not return the expected authorization code and client ID.', 400)

    try {
      const { token, scopes } = await exchangeCode(issuedClientId, code, flow.verifier, `http://127.0.0.1:${PORT}/auth/callback`)
      const claims = await verifyIdentity(token.id_token, issuedClientId, flow.nonce)
      const credentials = {
        clientId: issuedClientId,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        idToken: token.id_token,
        subject: claims.sub,
        email: typeof claims.email === 'string' ? claims.email : null,
        scopes,
        tokenType: token.token_type,
        expiresAt: Date.now() + token.expires_in * 1000,
        hostId: flow.hostId,
        nonce: flow.nonce,
      }
      await persistConfig({ hostId: flow.hostId, clientId: issuedClientId, email: credentials.email })
      pendingCredential = { origin: flow.origin, credentials }
      setTimeout(() => { if (pendingCredential?.credentials === credentials) pendingCredential = null }, 5 * 60 * 1000).unref()
      return sendHtml(response, '<!doctype html><meta charset="utf-8"><title>Connexion terminée</title><p>Connexion établie. Revenez à l’onglet Verbatims.</p><script>window.close()</script>')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OAuth failed'
      console.error('[verbatims-oauth-helper]', message)
      pendingCredential = { origin: flow.origin, error: message }
      return sendHtml(response, 'Connexion non établie. Revenez dans Verbatims pour consulter le message et réessayer.', 500)
    }
  }

  sendHtml(response, 'Not found', 404)
})

server.on('error', error => {
  console.error(`Could not start OAuth helper on 127.0.0.1:${PORT}: ${error.message}`)
  process.exitCode = 1
})
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Verbatims ChatGPT OAuth helper is ready on 127.0.0.1:${PORT}.`)
  console.log('Keep this process running, return to the Verbatims admin page, and click Connect ChatGPT.')
})
