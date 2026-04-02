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

function hasOwnField(input: unknown, field: string): input is Record<string, unknown> {
  return Boolean(input && typeof input === 'object' && Object.prototype.hasOwnProperty.call(input, field))
}

function assignOptionalString(target: Record<string, string | boolean>, input: unknown, field: string) {
  if (!hasOwnField(input, field)) {
    return
  }

  target[field] = normalizeOptionalString(input[field])
}

function assignOptionalBoolean(target: Record<string, string | boolean>, input: unknown, field: string, fallback = false) {
  if (!hasOwnField(input, field)) {
    return
  }

  target[field] = normalizeBoolean(input[field], fallback)
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
    const values: Record<string, string | boolean> = {}
    assignOptionalBoolean(values, body, 'enabled', true)
    assignOptionalString(values, body, 'oauth2AccessToken')
    assignOptionalString(values, body, 'oauth1ConsumerKey')
    assignOptionalString(values, body, 'oauth1ConsumerSecret')
    assignOptionalString(values, body, 'oauth1AccessToken')
    assignOptionalString(values, body, 'oauth1AccessTokenSecret')
    assignOptionalBoolean(values, body, 'requireMedia', false)

    await updateSocialProviderConfigStore({
      platform,
      values
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
    const values: Record<string, string | boolean> = {}
    assignOptionalBoolean(values, body, 'enabled', false)
    assignOptionalString(values, body, 'service')
    assignOptionalString(values, body, 'identifier')
    assignOptionalString(values, body, 'password')
    assignOptionalString(values, body, 'hashtags')

    await updateSocialProviderConfigStore({
      platform,
      values
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
          password: resolved.password,
          hashtags: resolved.hashtags
        },
        sources: resolved.sources
      }
    }
  }

  if (platform === 'instagram') {
    const values: Record<string, string | boolean> = {}
    assignOptionalBoolean(values, body, 'enabled', false)

    await updateSocialProviderConfigStore({
      platform,
      values
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
    const values: Record<string, string | boolean> = {}
    assignOptionalBoolean(values, body, 'enabled', false)

    await updateSocialProviderConfigStore({
      platform,
      values
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
    const values: Record<string, string | boolean> = {}
    assignOptionalBoolean(values, body, 'enabled', false)

    await updateSocialProviderConfigStore({
      platform,
      values
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
  const values: Record<string, string | boolean> = {}
  assignOptionalBoolean(values, body, 'enabled', false)
  assignOptionalString(values, body, 'accessToken')
  assignOptionalString(values, body, 'boardId')
  assignOptionalString(values, body, 'baseUrl')
  assignOptionalString(values, body, 'apiVersion')

  await updateSocialProviderConfigStore({
    platform,
    values
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
