import { runSocialAutopostWithOptions } from '../../../utils/social-autopost'
import type { SocialPlatform } from '#shared/constants/social'
import { isSocialPlatform, SOCIAL_PLATFORM_ERROR_MESSAGE } from '#shared/constants/social'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody(event)
  const platform = body?.platform ? String(body.platform) : undefined

  if (platform && !isSocialPlatform(platform)) {
    throw createError({ statusCode: 400, statusMessage: SOCIAL_PLATFORM_ERROR_MESSAGE })
  }

  const selectedPlatform: SocialPlatform | undefined = platform && isSocialPlatform(platform)
    ? platform
    : undefined

  const configuredBaseSiteUrl = String(process.env.NUXT_PUBLIC_SITE_URL || '').trim().replace(/\/$/, '')
  const requestUrl = getRequestURL(event)
  const requestBaseSiteUrl = `${requestUrl.protocol}//${requestUrl.host}`.replace(/\/$/, '')
  const baseSiteUrl = configuredBaseSiteUrl || requestBaseSiteUrl

  if (selectedPlatform === 'instagram' || selectedPlatform === 'threads' || selectedPlatform === 'pinterest' || selectedPlatform === 'facebook') {
    const host = (() => {
      try {
        return new URL(baseSiteUrl).hostname.toLowerCase()
      } catch {
        return ''
      }
    })()

    const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')
    if (isLocalHost) {
      const providerLabel = selectedPlatform === 'threads'
        ? 'Threads'
        : selectedPlatform === 'facebook'
          ? 'Facebook'
        : selectedPlatform === 'pinterest'
          ? 'Pinterest'
          : 'Instagram'

      const providerRequirement = selectedPlatform === 'pinterest'
        ? 'a public HTTPS quote URL in the pin link field'
        : selectedPlatform === 'facebook'
          ? 'a public image URL reachable by Facebook'
        : 'a public JPEG URL'

      return {
        success: true,
        data: {
          success: false,
          reason: `${providerLabel} requires ${providerRequirement}. Set NUXT_PUBLIC_SITE_URL to a public domain (not localhost) before using Run now.`
        }
      }
    }
  }

  const result = await runSocialAutopostWithOptions({ force: true, platform: selectedPlatform, baseSiteUrl })

  return {
    success: true,
    data: result
  }
})
