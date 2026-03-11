import { getMetaSocialCredentials, resolveThreadsOAuthConfig, setMetaSocialCredentials } from '../../../../utils/social-meta-config'
import { createError, defineEventHandler, getQuery, getRequestURL, sendRedirect } from 'h3'
import { useStorage } from 'nitropack/runtime/internal/storage'

const THREADS_OAUTH_STATE_PREFIX = 'social:threads:oauth:state:'

type ThreadsErrorPayload = {
  error?: {
    message?: string
  }
  error_message?: string
}

async function threadsPostForm(url: string, body: Record<string, string>) {
  const form = new URLSearchParams()
  for (const [key, value] of Object.entries(body)) {
    form.set(key, value)
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form.toString()
  })

  const payload = await response.json().catch(() => ({})) as ThreadsErrorPayload & Record<string, any>
  if (!response.ok || payload?.error || payload?.error_message) {
    throw new Error(payload?.error?.message || payload?.error_message || `Threads request failed (${response.status})`)
  }

  return payload
}

async function threadsGet(url: string, params: Record<string, string>) {
  const requestUrl = new URL(url)
  for (const [key, value] of Object.entries(params)) {
    requestUrl.searchParams.set(key, value)
  }

  const response = await fetch(requestUrl)
  const payload = await response.json().catch(() => ({})) as ThreadsErrorPayload & Record<string, any>
  if (!response.ok || payload?.error || payload?.error_message) {
    throw new Error(payload?.error?.message || payload?.error_message || `Threads request failed (${response.status})`)
  }

  return payload
}

function formatCallbackError(returnPath: string, message: string) {
  const normalizedPath = returnPath.startsWith('/') ? returnPath : '/admin/social-queue'
  const url = new URL(normalizedPath, 'https://verbatims.local')
  url.searchParams.set('threadsConnect', 'error')
  url.searchParams.set('threadsReason', message)
  return `${url.pathname}${url.search}`
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const query = getQuery(event)
  const error = String(query.error || '')
  const errorReason = String(query.error_reason || '')
  const errorDescription = String(query.error_description || '')
  if (error) {
    return sendRedirect(event, formatCallbackError('/admin/social-queue', errorDescription || errorReason || error))
  }

  const code = String(query.code || '').replace(/#_$/, '')
  const state = String(query.state || '')
  if (!code || !state) {
    return sendRedirect(event, '/admin/social-queue?threadsConnect=error&threadsReason=Missing%20OAuth%20code%20or%20state')
  }

  const stateKey = `${THREADS_OAUTH_STATE_PREFIX}${state}`
  const storedState = await useStorage('kv').getItem<{ createdBy?: number, returnPath?: string }>(stateKey)
  await useStorage('kv').removeItem(stateKey)
  if (!storedState || storedState.createdBy !== session.user.id) {
    return sendRedirect(event, '/admin/social-queue?threadsConnect=error&threadsReason=Invalid%20or%20expired%20OAuth%20state')
  }

  const returnPath = storedState.returnPath || '/admin/social-queue'
  const requestUrl = getRequestURL(event)
  const origin = `${requestUrl.protocol}//${requestUrl.host}`.replace(/\/$/, '')
  const resolvedOAuth = await resolveThreadsOAuthConfig({ origin })
  if (!resolvedOAuth.appId || !resolvedOAuth.appSecret) {
    return sendRedirect(event, formatCallbackError(returnPath, 'Missing Threads app credentials (configure Threads OAuth settings or THREADS_APP_ID + THREADS_APP_SECRET)'))
  }

  try {
    const existingCredentials = await getMetaSocialCredentials()

    const shortLived = await threadsPostForm('https://graph.threads.net/oauth/access_token', {
      client_id: resolvedOAuth.appId,
      client_secret: resolvedOAuth.appSecret,
      grant_type: 'authorization_code',
      redirect_uri: resolvedOAuth.redirectUri,
      code
    })

    const shortToken = String(shortLived?.access_token || '')
    const shortUserId = String(shortLived?.user_id || '')
    if (!shortToken) {
      throw new Error('No short-lived Threads access token returned')
    }

    const longLived = await threadsGet('https://graph.threads.net/access_token', {
      grant_type: 'th_exchange_token',
      client_secret: resolvedOAuth.appSecret,
      access_token: shortToken
    })

    const longToken = String(longLived?.access_token || '')
    if (!longToken) {
      throw new Error('No long-lived Threads access token returned')
    }

    const expiresIn = Number(longLived?.expires_in || 0)
    const expiresAt = Number.isFinite(expiresIn) && expiresIn > 0
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : undefined

    const profile = await threadsGet('https://graph.threads.net/v1.0/me', {
      fields: 'id,username',
      access_token: longToken
    })

    const userId = String(profile?.id || shortUserId || '')
    if (!userId) {
      throw new Error('Threads API did not return a user ID for this token')
    }

    await setMetaSocialCredentials({
      updatedAt: new Date().toISOString(),
      instagram: existingCredentials?.instagram,
      threads: {
        accessToken: longToken,
        userId,
        username: String(profile?.username || existingCredentials?.threads?.username || ''),
        expiresAt,
        tokenUpdatedAt: new Date().toISOString()
      },
      facebook: existingCredentials?.facebook
    })

    const done = new URL(returnPath.startsWith('/') ? returnPath : '/admin/social-queue', 'https://verbatims.local')
    done.searchParams.set('threadsConnect', 'ok')
    done.searchParams.set('threadsUserId', userId)
    return sendRedirect(event, `${done.pathname}${done.search}`)
  } catch (oauthError: any) {
    return sendRedirect(event, formatCallbackError(returnPath, String(oauthError?.message || 'Threads OAuth callback failed')))
  }
})