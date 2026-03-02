import { resolveFacebookEnabledConfig, resolveInstagramEnabledConfig, resolveThreadsEnabledConfig } from "~~/server/utils/social-provider-config"

function normalizeOptionalString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  }
  return fallback
}

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
  const body = await readBody(event)

  if (platform === 'x') {
    await updateSocialProviderConfigStore({
      platform,
      values: {
        enabled: normalizeBoolean(body?.enabled, true),
        oauth2AccessToken: normalizeOptionalString(body?.oauth2AccessToken),
        oauth1ConsumerKey: normalizeOptionalString(body?.oauth1ConsumerKey),
        oauth1ConsumerSecret: normalizeOptionalString(body?.oauth1ConsumerSecret),
        oauth1AccessToken: normalizeOptionalString(body?.oauth1AccessToken),
        oauth1AccessTokenSecret: normalizeOptionalString(body?.oauth1AccessTokenSecret),
        requireMedia: normalizeBoolean(body?.requireMedia, false)
      }
    })

    const resolved = await resolveXProviderConfig()
    return {
      success: true,
      data: {
        platform,
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
    await updateSocialProviderConfigStore({
      platform,
      values: {
        enabled: normalizeBoolean(body?.enabled, false),
        service: normalizeOptionalString(body?.service),
        identifier: normalizeOptionalString(body?.identifier),
        password: normalizeOptionalString(body?.password)
      }
    })

    const resolved = await resolveBlueskyProviderConfig()
    return {
      success: true,
      data: {
        platform,
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
    await updateSocialProviderConfigStore({
      platform,
      values: {
        enabled: normalizeBoolean(body?.enabled, false)
      }
    })

    const resolved = await resolveInstagramEnabledConfig()
    return {
      success: true,
      data: {
        platform,
        values: {
          enabled: resolved.enabled
        },
        sources: resolved.sources
      }
    }
  }

  if (platform === 'threads') {
    await updateSocialProviderConfigStore({
      platform,
      values: {
        enabled: normalizeBoolean(body?.enabled, false)
      }
    })

    const resolved = await resolveThreadsEnabledConfig()
    return {
      success: true,
      data: {
        platform,
        values: {
          enabled: resolved.enabled
        },
        sources: resolved.sources
      }
    }
  }

  if (platform === 'facebook') {
    await updateSocialProviderConfigStore({
      platform,
      values: {
        enabled: normalizeBoolean(body?.enabled, false)
      }
    })

    const resolved = await resolveFacebookEnabledConfig()
    return {
      success: true,
      data: {
        platform,
        values: {
          enabled: resolved.enabled
        },
        sources: resolved.sources
      }
    }
  }

  const runtimeConfig = useRuntimeConfig(event)
  await updateSocialProviderConfigStore({
    platform,
    values: {
      enabled: normalizeBoolean(body?.enabled, false),
      accessToken: normalizeOptionalString(body?.accessToken),
      boardId: normalizeOptionalString(body?.boardId),
      baseUrl: normalizeOptionalString(body?.baseUrl),
      apiVersion: normalizeOptionalString(body?.apiVersion)
    }
  })

  const resolved = await resolvePinterestProviderConfig({ runtimeConfig })
  return {
    success: true,
    data: {
      platform,
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
