import { isSocialPlatform, isUnimplementedSocialPlatform, SOCIAL_PLATFORM_ERROR_MESSAGE } from '#shared/constants/social'
import { resolveFacebookEnabledConfig, resolveInstagramEnabledConfig, resolveThreadsEnabledConfig } from '~~/server/utils/social-provider-config'
import { getXAuthConfig } from '~~/server/utils/social-x-auth'

type InstagramDiscoveryPayload = {
  data?: Array<{
    id?: string
    name?: string
    instagram_business_account?: {
      id?: string
      username?: string
    }
  }>
  error?: {
    message?: string
  }
}

async function discoverInstagramBusinessAccount(input: {
  baseUrl: string
  apiVersion: string
  accessToken: string
}) {
  try {
    const response = await fetch(`${input.baseUrl}/${input.apiVersion}/me/accounts?fields=id,name,instagram_business_account{id,username}&limit=50`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${input.accessToken}`
      }
    })

    const payload = await response.json().catch(() => null) as InstagramDiscoveryPayload | null
    if (!response.ok) {
      return {
        accountId: '',
        username: '',
        reason: payload?.error?.message || `Instagram discovery error (${response.status})`
      }
    }

    const pageWithInstagram = payload?.data?.find(page => page?.instagram_business_account?.id)
    return {
      accountId: pageWithInstagram?.instagram_business_account?.id || '',
      username: pageWithInstagram?.instagram_business_account?.username || '',
      reason: pageWithInstagram?.instagram_business_account?.id ? '' : 'No Instagram business account found on pages accessible by this token'
    }
  } catch (error: any) {
    return {
      accountId: '',
      username: '',
      reason: error?.message || 'Network error while discovering Instagram account'
    }
  }
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody(event)
  const platform = String(body?.platform || 'x')

  if (!isSocialPlatform(platform)) {
    throw createError({ statusCode: 400, statusMessage: SOCIAL_PLATFORM_ERROR_MESSAGE })
  }

  if (isUnimplementedSocialPlatform(platform)) {
    return {
      success: true,
      data: {
        ok: false,
        platform,
        reason: `${platform} provider is not implemented yet`
      }
    }
  }

  if (platform === 'pinterest') {
    const runtimeConfig = useRuntimeConfig(event)
    const resolved = await resolvePinterestProviderConfig({ runtimeConfig })
    const baseUrl = resolved.baseUrl
    const apiVersion = resolved.apiVersion
    const accessToken = resolved.accessToken
    const boardId = resolved.boardId

    if (!resolved.enabled) {
      return {
        success: true,
        data: {
          ok: false,
          platform,
          reason: 'Provider is disabled (set Pinterest enabled in provider settings or NUXT_PINTEREST_POST_ENABLED=true)'
        }
      }
    }

    if (!accessToken || !boardId) {
      return {
        success: true,
        data: {
          ok: false,
          platform,
          reason: 'Missing Pinterest access token or board id (expected KV provider settings or env fallback)'
        }
      }
    }

    try {
      const response = await fetch(`${baseUrl}/${apiVersion}/boards/${boardId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      const payload = await response.json().catch(() => null) as {
        id?: string
        name?: string
        owner?: {
          username?: string
        }
        message?: string
        error?: {
          message?: string
        }
      } | null

      if (!response.ok) {
        const rawReason = payload?.message || payload?.error?.message || `Pinterest API error (${response.status})`
        const isAuthFailed = typeof rawReason === 'string' && rawReason.toLowerCase().includes('authentication failed')
        const usingProdHost = baseUrl.includes('api.pinterest.com') && !baseUrl.includes('api-sandbox.pinterest.com')
        const reason = isAuthFailed && usingProdHost
          ? `${rawReason} If you are using a Sandbox token, set Pinterest base URL to https://api-sandbox.pinterest.com.`
          : rawReason

        return {
          success: true,
          data: {
            ok: false,
            platform,
            reason
          }
        }
      }

      const boardLabel = payload?.owner?.username && payload?.name
        ? `${payload.owner.username}/${payload.name}`
        : payload?.name || payload?.id || boardId

      return {
        success: true,
        data: {
          ok: true,
          platform,
          account: boardLabel
        }
      }
    } catch (error: any) {
      return {
        success: true,
        data: {
          ok: false,
          platform,
          reason: error?.message || 'Network error while checking Pinterest credentials'
        }
      }
    }
  }

  if (platform === 'threads') {
    const enabledConfig = await resolveThreadsEnabledConfig()
    if (!enabledConfig.enabled) {
      return {
        success: true,
        data: {
          ok: false,
          platform,
          reason: 'Provider is disabled (set Threads enabled in provider settings or NUXT_THREADS_POST_ENABLED=true)'
        }
      }
    }

    const baseUrl = String(process.env.NUXT_THREADS_POST_BASE_URL || 'https://graph.threads.net').replace(/\/$/, '')
    const apiVersion = String(process.env.NUXT_THREADS_POST_API_VERSION || 'v1.0').replace(/^\/+/, '')
    const resolved = await resolveThreadsPostConfig()
    const accessToken = resolved.accessToken
    const userId = resolved.userId

    if (!accessToken || !userId) {
      return {
        success: true,
        data: {
          ok: false,
          platform,
          reason: 'Missing Threads access token/user id (expected KV Meta OAuth credentials or NUXT_THREADS_POST_ACCESS_TOKEN + NUXT_THREADS_POST_USER_ID)'
        }
      }
    }

    try {
      const response = await fetch(`${baseUrl}/${apiVersion}/${userId}?fields=id,username`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      const payload = await response.json().catch(() => null) as {
        id?: string
        username?: string
        error?: { message?: string }
      } | null

      if (!response.ok) {
        return {
          success: true,
          data: {
            ok: false,
            platform,
            reason: payload?.error?.message || `Threads API error (${response.status})`
          }
        }
      }

      return {
        success: true,
        data: {
          ok: true,
          platform,
          account: payload?.username || payload?.id || userId
        }
      }
    } catch (error: any) {
      return {
        success: true,
        data: {
          ok: false,
          platform,
          reason: error?.message || 'Network error while checking Threads credentials'
        }
      }
    }
  }

  if (platform === 'instagram') {
    const enabledConfig = await resolveInstagramEnabledConfig()
    if (!enabledConfig.enabled) {
      return {
        success: true,
        data: {
          ok: false,
          platform,
          reason: 'Provider is disabled (set Instagram enabled in provider settings or NUXT_INSTAGRAM_POST_ENABLED=true)'
        }
      }
    }

    const baseUrl = String(process.env.NUXT_INSTAGRAM_POST_BASE_URL || 'https://graph.facebook.com').replace(/\/$/, '')
    const apiVersion = String(process.env.NUXT_INSTAGRAM_POST_API_VERSION || 'v24.0').replace(/^\/+/, '')
    const resolved = await resolveInstagramPostConfig()
    const accessToken = resolved.accessToken
    const igUserId = resolved.userId

    if (!accessToken) {
      return {
        success: true,
        data: {
          ok: false,
          platform,
          reason: 'Missing Instagram access token (expected KV Meta OAuth credentials or NUXT_INSTAGRAM_POST_ACCESS_TOKEN)'
        }
      }
    }

    try {
      const discovered = await discoverInstagramBusinessAccount({
        baseUrl,
        apiVersion,
        accessToken
      })

      const candidateIds = [
        igUserId,
        discovered.accountId
      ].filter((value, index, array) => Boolean(value) && array.indexOf(value) === index)

      if (!candidateIds.length) {
        return {
          success: true,
          data: {
            ok: false,
            platform,
            reason: discovered.reason || 'Missing NUXT_INSTAGRAM_POST_IG_USER_ID and could not discover an accessible Instagram account'
          }
        }
      }

      let lastError = ''

      for (const candidateId of candidateIds) {
        const response = await fetch(`${baseUrl}/${apiVersion}/${candidateId}?fields=id,username`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        const payload = await response.json().catch(() => null) as {
          id?: string
          username?: string
          error?: { message?: string }
        } | null

        if (response.ok) {
          return {
            success: true,
            data: {
              ok: true,
              platform,
              account: payload?.username || payload?.id || candidateId
            }
          }
        }

        lastError = payload?.error?.message || `Instagram API error (${response.status})`
      }

      if (igUserId && discovered.accountId && igUserId !== discovered.accountId) {
        return {
          success: true,
          data: {
            ok: false,
            platform,
            reason: `Configured NUXT_INSTAGRAM_POST_IG_USER_ID (${igUserId}) is not accessible with the current token. Discovered accessible IG account: ${discovered.accountId}${discovered.username ? ` (@${discovered.username})` : ''}. Update NUXT_INSTAGRAM_POST_IG_USER_ID and restart the server.`
          }
        }
      }

      return {
        success: true,
        data: {
          ok: false,
          platform,
          reason: lastError || discovered.reason || 'Instagram account check failed'
        }
      }
    } catch (error: any) {
      return {
        success: true,
        data: {
          ok: false,
          platform,
          reason: error?.message || 'Network error while checking Instagram credentials'
        }
      }
    }
  }

  if (platform === 'facebook') {
    const enabledConfig = await resolveFacebookEnabledConfig()
    if (!enabledConfig.enabled) {
      return {
        success: true,
        data: {
          ok: false,
          platform,
          reason: 'Provider is disabled (set Facebook enabled in provider settings or NUXT_FACEBOOK_POST_ENABLED=true)'
        }
      }
    }

    const baseUrl = String(process.env.NUXT_FACEBOOK_POST_BASE_URL || 'https://graph.facebook.com').replace(/\/$/, '')
    const apiVersion = String(process.env.NUXT_FACEBOOK_POST_API_VERSION || 'v24.0').replace(/^\/+/, '')
    const resolved = await resolveFacebookPostConfig()
    const accessToken = resolved.pageAccessToken
    const pageId = resolved.pageId

    if (!accessToken || !pageId) {
      return {
        success: true,
        data: {
          ok: false,
          platform,
          reason: 'Missing Facebook page token/page id (expected KV Meta OAuth credentials or NUXT_FACEBOOK_POST_ACCESS_TOKEN + NUXT_FACEBOOK_POST_PAGE_ID)'
        }
      }
    }

    try {
      const response = await fetch(`${baseUrl}/${apiVersion}/${pageId}?fields=id,name`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      const payload = await response.json().catch(() => null) as {
        id?: string
        name?: string
        error?: { message?: string }
      } | null

      if (!response.ok) {
        return {
          success: true,
          data: {
            ok: false,
            platform,
            reason: payload?.error?.message || `Facebook API error (${response.status})`
          }
        }
      }

      return {
        success: true,
        data: {
          ok: true,
          platform,
          account: payload?.name || payload?.id || pageId
        }
      }
    } catch (error: any) {
      return {
        success: true,
        data: {
          ok: false,
          platform,
          reason: error?.message || 'Network error while checking Facebook credentials'
        }
      }
    }
  }

  if (platform === 'bluesky') {
    const resolved = await resolveBlueskyProviderConfig()
    const service = resolved.service
    const identifier = resolved.identifier
    const password = resolved.password

    if (!resolved.enabled) {
      return {
        success: true,
        data: {
          ok: false,
          platform,
          reason: 'Provider is disabled (set Bluesky enabled in provider settings or NUXT_BLUESKY_POST_ENABLED=true)'
        }
      }
    }

    if (!identifier || !password) {
      return {
        success: true,
        data: {
          ok: false,
          platform,
          reason: 'Missing Bluesky identifier or password (expected KV provider settings or env fallback)'
        }
      }
    }

    try {
      const response = await fetch(`${service}/xrpc/com.atproto.server.createSession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier, password })
      })

      const payload = await response.json().catch(() => null) as {
        did?: string
        handle?: string
        message?: string
        error?: string
      } | null

      if (!response.ok) {
        return {
          success: true,
          data: {
            ok: false,
            platform,
            reason: payload?.message || payload?.error || `Bluesky auth error (${response.status})`
          }
        }
      }

      return {
        success: true,
        data: {
          ok: true,
          platform,
          account: payload?.handle || payload?.did || identifier
        }
      }
    } catch (error: any) {
      return {
        success: true,
        data: {
          ok: false,
          platform,
          reason: error?.message || 'Network error while checking Bluesky credentials'
        }
      }
    }
  }

  const xConfig = await resolveXProviderConfig()
  if (!xConfig.enabled) {
    return {
      success: true,
      data: {
        ok: false,
        platform,
        reason: 'Provider is disabled (set X enabled in provider settings or NUXT_X_POST_ENABLED=true)'
      }
    }
  }

  const xAuth = getXAuthConfig({
    oauth2AccessToken: xConfig.oauth2AccessToken,
    oauth1ConsumerKey: xConfig.oauth1ConsumerKey,
    oauth1ConsumerSecret: xConfig.oauth1ConsumerSecret,
    oauth1AccessToken: xConfig.oauth1AccessToken,
    oauth1AccessTokenSecret: xConfig.oauth1AccessTokenSecret
  })
  if (xAuth.mode === 'none') {
    return {
      success: true,
      data: {
        ok: false,
        platform,
        reason: `${getXCredentialErrorMessage()} (expected KV provider settings or env fallback)`
      }
    }
  }

  try {
    const headers = await buildXAuthHeaders({
      method: 'GET',
      url: 'https://api.x.com/2/users/me',
      auth: xAuth
    })

    const response = await fetch('https://api.x.com/2/users/me', {
      method: 'GET',
      headers
    })

    const payload = await response.json().catch(() => null) as {
      data?: { username?: string; id?: string }
      detail?: string
      title?: string
    } | null

    if (!response.ok) {
      const reason = withXUserContextHint(payload?.detail || payload?.title || `X API error (${response.status})`)

      return {
        success: true,
        data: {
          ok: false,
          platform,
          reason
        }
      }
    }

    return {
      success: true,
      data: {
        ok: true,
        platform,
        account: payload?.data?.username || payload?.data?.id || 'authenticated',
        authMode: xAuth.mode
      }
    }
  } catch (error: any) {
    return {
      success: true,
      data: {
        ok: false,
        platform,
        reason: error?.message || 'Network error while checking X credentials'
      }
    }
  }
})