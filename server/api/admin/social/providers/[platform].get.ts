import { resolveInstagramEnabledConfig, resolveThreadsEnabledConfig, resolveFacebookEnabledConfig } from "~~/server/utils/social-provider-config"

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || session.user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const platformParam = String(getRouterParam(event, 'platform') || '').trim().toLowerCase()
  if (!isEditableSocialProvider(platformParam)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported provider' })
  }

  const platform = platformParam as EditableSocialProvider
  const stored = await getSocialProviderConfigStore()

  if (platform === 'x') {
    const resolved = await resolveXProviderConfig()

    return {
      success: true,
      data: {
        platform,
        updatedAt: stored?.updatedAt || null,
        values: {
          enabled: resolved.enabled,
          oauth2AccessToken: resolved.oauth2AccessToken,
          oauth1ConsumerKey: resolved.oauth1ConsumerKey,
          oauth1ConsumerSecret: resolved.oauth1ConsumerSecret,
          oauth1AccessToken: resolved.oauth1AccessToken,
          oauth1AccessTokenSecret: resolved.oauth1AccessTokenSecret,
          requireMedia: resolved.requireMedia
        },
        sources: resolved.sources
      }
    }
  }

  if (platform === 'bluesky') {
    const resolved = await resolveBlueskyProviderConfig()

    return {
      success: true,
      data: {
        platform,
        updatedAt: stored?.updatedAt || null,
        values: {
          enabled: resolved.enabled,
          service: resolved.service,
          identifier: resolved.identifier,
          password: resolved.password
        },
        sources: resolved.sources
      }
    }
  }

  if (platform === 'instagram') {
    const resolved = await resolveInstagramEnabledConfig()

    return {
      success: true,
      data: {
        platform,
        updatedAt: stored?.updatedAt || null,
        values: {
          enabled: resolved.enabled
        },
        sources: resolved.sources
      }
    }
  }

  if (platform === 'threads') {
    const resolved = await resolveThreadsEnabledConfig()

    return {
      success: true,
      data: {
        platform,
        updatedAt: stored?.updatedAt || null,
        values: {
          enabled: resolved.enabled
        },
        sources: resolved.sources
      }
    }
  }

  if (platform === 'facebook') {
    const resolved = await resolveFacebookEnabledConfig()

    return {
      success: true,
      data: {
        platform,
        updatedAt: stored?.updatedAt || null,
        values: {
          enabled: resolved.enabled
        },
        sources: resolved.sources
      }
    }
  }

  const runtimeConfig = useRuntimeConfig(event)
  const resolved = await resolvePinterestProviderConfig({ runtimeConfig })

  return {
    success: true,
    data: {
      platform,
      updatedAt: stored?.updatedAt || null,
      values: {
        enabled: resolved.enabled,
        accessToken: resolved.accessToken,
        boardId: resolved.boardId,
        baseUrl: resolved.baseUrl,
        apiVersion: resolved.apiVersion
      },
      sources: resolved.sources
    }
  }
})
