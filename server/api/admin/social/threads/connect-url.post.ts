import { createError, defineEventHandler, getRequestURL, readBody } from 'h3'
import { useStorage } from 'nitropack/runtime/internal/storage'
import { resolveThreadsOAuthConfig } from '../../../../utils/social-meta-config'

const THREADS_OAUTH_STATE_PREFIX = 'social:threads:oauth:state:'
const THREADS_DEFAULT_SCOPES = [
  'threads_basic',
  'threads_content_publish'
]

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody(event)
  const returnPath = typeof body?.returnPath === 'string' && body.returnPath.startsWith('/')
    ? body.returnPath
    : '/admin/social-queue'

  const requestUrl = getRequestURL(event)
  const origin = `${requestUrl.protocol}//${requestUrl.host}`.replace(/\/$/, '')
  const resolvedOAuth = await resolveThreadsOAuthConfig({ origin })
  const appId = resolvedOAuth.appId
  if (!appId) {
    throw createError({ statusCode: 500, statusMessage: 'Missing Threads App ID (configure Threads OAuth settings or THREADS_APP_ID)' })
  }

  const state = crypto.randomUUID()
  await useStorage('kv').setItem(`${THREADS_OAUTH_STATE_PREFIX}${state}`, {
    createdAt: new Date().toISOString(),
    createdBy: session.user.id,
    returnPath
  })

  const authUrl = new URL('https://threads.net/oauth/authorize')
  authUrl.searchParams.set('client_id', appId)
  authUrl.searchParams.set('redirect_uri', resolvedOAuth.redirectUri)
  authUrl.searchParams.set('scope', THREADS_DEFAULT_SCOPES.join(','))
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('state', state)

  return {
    success: true,
    data: {
      authUrl: authUrl.toString(),
      redirectUri: resolvedOAuth.redirectUri,
      scopes: THREADS_DEFAULT_SCOPES
    }
  }
})