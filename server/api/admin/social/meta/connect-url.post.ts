import { createError, defineEventHandler, getRequestURL, readBody } from 'h3'
import { useStorage } from 'nitropack/runtime/internal/storage'
import { resolveMetaOAuthConfig } from '../../../../utils/social-meta-config'

const META_OAUTH_STATE_PREFIX = 'social:meta:oauth:state:'
const META_DEFAULT_SCOPES = [
  'threads_basic',
  'threads_content_publish',
  'instagram_basic',
  'instagram_content_publish',
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'pages_manage_metadata',
  'business_management'
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
  const preferredPageId = typeof body?.pageId === 'string' ? body.pageId.trim() : ''

  const requestUrl = getRequestURL(event)
  const origin = `${requestUrl.protocol}//${requestUrl.host}`.replace(/\/$/, '')
  const resolvedOAuth = await resolveMetaOAuthConfig({ origin })
  const appId = resolvedOAuth.appId
  if (!appId) {
    throw createError({ statusCode: 500, statusMessage: 'Missing Meta App ID (configure Meta settings or META_APP_ID)' })
  }

  const redirectUri = resolvedOAuth.redirectUri
  const apiVersion = String(process.env.NUXT_FACEBOOK_POST_API_VERSION || process.env.NUXT_INSTAGRAM_POST_API_VERSION || 'v25.0').replace(/^\/+/, '')

  const state = crypto.randomUUID()
  await useStorage('kv').setItem(`${META_OAUTH_STATE_PREFIX}${state}`, {
    createdAt: new Date().toISOString(),
    createdBy: session.user.id,
    returnPath,
    preferredPageId
  })

  const authUrl = new URL(`https://www.facebook.com/${apiVersion}/dialog/oauth`)
  authUrl.searchParams.set('client_id', appId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', META_DEFAULT_SCOPES.join(','))
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('state', state)

  return {
    success: true,
    data: {
      authUrl: authUrl.toString(),
      redirectUri,
      scopes: META_DEFAULT_SCOPES,
      preferredPageId: preferredPageId || null
    }
  }
})
