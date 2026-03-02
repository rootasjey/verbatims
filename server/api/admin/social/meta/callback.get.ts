import { getMetaSocialCredentials, resolveMetaOAuthConfig, setMetaSocialCredentials } from '../../../../utils/social-meta-config'
import { createError, defineEventHandler, getQuery, getRequestURL, sendRedirect } from 'h3'
import { useStorage } from 'nitropack/runtime/internal/storage'

const META_OAUTH_STATE_PREFIX = 'social:meta:oauth:state:'

type GraphErrorPayload = {
  error?: {
    message?: string
  }
}

async function graphGet(url: string, params: Record<string, string>) {
  const requestUrl = new URL(url)
  for (const [key, value] of Object.entries(params)) {
    requestUrl.searchParams.set(key, value)
  }

  const response = await fetch(requestUrl)
  const payload = await response.json().catch(() => ({})) as GraphErrorPayload & Record<string, any>

  if (!response.ok || payload?.error) {
    throw new Error(payload?.error?.message || `Graph request failed (${response.status})`)
  }

  return payload
}

function formatCallbackError(returnPath: string, message: string) {
  const normalizedPath = returnPath.startsWith('/') ? returnPath : '/admin/social-queue'
  const url = new URL(normalizedPath, 'https://verbatims.local')
  url.searchParams.set('metaConnect', 'error')
  url.searchParams.set('metaReason', message)
  return `${url.pathname}${url.search}`
}

async function discoverThreadsAccount(input: {
  accessToken: string
  expiresAt?: string
}) {
  const baseUrl = String(process.env.NUXT_THREADS_POST_BASE_URL || 'https://graph.threads.net').replace(/\/$/, '')
  const apiVersion = String(process.env.NUXT_THREADS_POST_API_VERSION || 'v1.0').replace(/^\/+/, '')

  try {
    const payload = await graphGet(`${baseUrl}/${apiVersion}/me`, {
      fields: 'id,username',
      access_token: input.accessToken
    }) as {
      id?: string
      username?: string
    }

    const userId = String(payload?.id || '')
    if (!userId) {
      return null
    }

    return {
      accessToken: input.accessToken,
      userId,
      username: String(payload?.username || ''),
      expiresAt: input.expiresAt
    }
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const query = getQuery(event)
  const code = String(query.code || '')
  const state = String(query.state || '')

  if (!code || !state) {
    return sendRedirect(event, '/admin/social-queue?metaConnect=error&metaReason=Missing%20OAuth%20code%20or%20state')
  }

  const stateKey = `${META_OAUTH_STATE_PREFIX}${state}`
  const storedState = await useStorage('kv').getItem<{ createdBy?: number, returnPath?: string, preferredPageId?: string }>(stateKey)
  await useStorage('kv').removeItem(stateKey)

  if (!storedState || storedState.createdBy !== session.user.id) {
    return sendRedirect(event, '/admin/social-queue?metaConnect=error&metaReason=Invalid%20or%20expired%20OAuth%20state')
  }

  const returnPath = storedState.returnPath || '/admin/social-queue'

  const requestUrl = getRequestURL(event)
  const origin = `${requestUrl.protocol}//${requestUrl.host}`.replace(/\/$/, '')
  const resolvedOAuth = await resolveMetaOAuthConfig({ origin })
  const appId = resolvedOAuth.appId
  const appSecret = resolvedOAuth.appSecret
  if (!appId || !appSecret) {
    return sendRedirect(event, formatCallbackError(returnPath, 'Missing Meta app credentials (configure Meta settings or META_APP_ID + META_APP_SECRET)'))
  }

  const redirectUri = resolvedOAuth.redirectUri
  const apiVersion = String(process.env.NUXT_FACEBOOK_POST_API_VERSION || process.env.NUXT_INSTAGRAM_POST_API_VERSION || 'v25.0').replace(/^\/+/, '')

  try {
    const existingCredentials = await getMetaSocialCredentials()

    const shortLived = await graphGet(`https://graph.facebook.com/${apiVersion}/oauth/access_token`, {
      client_id: appId,
      redirect_uri: redirectUri,
      client_secret: appSecret,
      code
    })

    const shortToken = String(shortLived?.access_token || '')
    if (!shortToken) {
      throw new Error('No short-lived access token returned by Meta')
    }

    const longLived = await graphGet(`https://graph.facebook.com/${apiVersion}/oauth/access_token`, {
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortToken
    })

    const longUserToken = String(longLived?.access_token || '')
    if (!longUserToken) {
      throw new Error('No long-lived user token returned by Meta')
    }

    const expiresIn = Number(longLived?.expires_in || 0)
    const expiresAt = Number.isFinite(expiresIn) && expiresIn > 0
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : undefined

    const accounts = await graphGet(`https://graph.facebook.com/${apiVersion}/me/accounts`, {
      fields: 'id,name,access_token,perms,instagram_business_account{id,username}',
      limit: '50',
      access_token: longUserToken
    })

    const pages = Array.isArray(accounts?.data) ? accounts.data as Array<{
      id?: string
      name?: string
      access_token?: string
      perms?: string[]
      instagram_business_account?: { id?: string, username?: string }
    }> : []

    if (!pages.length) {
      throw new Error('No managed Facebook Page found for this account. Ensure pages_show_list and pages_read_engagement are granted.')
    }

    const preferredPageId = String(storedState.preferredPageId || '')
    const selectedPage = (preferredPageId
      ? pages.find(page => page?.id === preferredPageId)
      : null) || pages[0]

    if (!selectedPage?.id || !selectedPage?.access_token) {
      throw new Error('Unable to select a managed Facebook Page with a valid page token.')
    }

    const pageWithInstagram = pages.find(page => page?.instagram_business_account?.id)
    const instagramAccount = selectedPage.instagram_business_account?.id
      ? selectedPage.instagram_business_account
      : pageWithInstagram?.instagram_business_account

    const threadsAccount = await discoverThreadsAccount({
      accessToken: longUserToken,
      expiresAt
    })

    await setMetaSocialCredentials({
      updatedAt: new Date().toISOString(),
      instagram: {
        accessToken: longUserToken,
        userId: String(instagramAccount?.id || ''),
        username: String(instagramAccount?.username || ''),
        expiresAt
      },
      threads: threadsAccount || existingCredentials?.threads,
      facebook: {
        pageId: String(selectedPage.id),
        pageName: String(selectedPage.name || ''),
        pageAccessToken: String(selectedPage.access_token),
        perms: Array.isArray(selectedPage.perms) ? selectedPage.perms.filter(perm => typeof perm === 'string') : []
      }
    })

    const done = new URL(returnPath.startsWith('/') ? returnPath : '/admin/social-queue', 'https://verbatims.local')
    done.searchParams.set('metaConnect', 'ok')
    done.searchParams.set('metaPageId', String(selectedPage.id))
    if (instagramAccount?.id) done.searchParams.set('metaIgUserId', String(instagramAccount.id))
    if (threadsAccount?.userId) done.searchParams.set('metaThreadsUserId', String(threadsAccount.userId))

    return sendRedirect(event, `${done.pathname}${done.search}`)
  } catch (error: any) {
    const reason = String(error?.message || 'Meta OAuth callback failed')
    return sendRedirect(event, formatCallbackError(returnPath, reason))
  }
})
