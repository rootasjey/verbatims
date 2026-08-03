import { runSocialAutopostNow } from '~~/server/utils/social-queue-api'
import { requireApiKeyRole, requireApiPermission } from '~~/server/utils/api-key'
import { checkRateLimit, setRateLimitHeaders } from '~~/server/utils/rate-limit'
import { resolveAppOrigin } from '~~/server/utils/app-origin'
import { isSocialPlatform, SOCIAL_PLATFORM_ERROR_MESSAGE } from '#shared/constants/social'

defineRouteMeta({
  openAPI: {
    summary: 'Run social autopost now',
    description: 'Immediately runs the social autopost for a platform (or all enabled platforms). This publishes the next eligible queued item. The call can take up to a couple of minutes. Throttled to 1 call per minute per API key.',
    tags: ['Social'],
    security: [{ apiKey: ['social:write'] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              platform: { type: 'string', enum: ['x', 'bluesky', 'instagram', 'threads', 'facebook', 'pinterest'], nullable: true, description: 'Target platform, or all enabled platforms if omitted' },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Autopost result' },
      '400': { description: 'Invalid platform' },
      '429': { description: 'Run-now throttled (1 per minute)' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'moderator', 'admin')
  requireApiPermission(api, 'social:write')

  const runNowResult = await checkRateLimit({
    key: `ratelimit:apikey:social:runnow:${api.id}`,
    max: 1,
    window: 60
  })
  setRateLimitHeaders(event, runNowResult, 1)
  if (!runNowResult.success) {
    throwServer(429, 'Run-now is throttled to 1 call per minute. Try again later.')
  }

  const body = await readBody(event)
  const platform = body?.platform ? String(body.platform) : undefined

  if (platform && !isSocialPlatform(platform)) {
    throwServer(400, SOCIAL_PLATFORM_ERROR_MESSAGE)
  }

  const selectedPlatform = platform && isSocialPlatform(platform)
    ? platform
    : undefined

  const configuredBaseSiteUrl = String(process.env.NUXT_PUBLIC_SITE_URL || '').trim().replace(/\/$/, '')
  const requestBaseSiteUrl = resolveAppOrigin(event)
  const baseSiteUrl = configuredBaseSiteUrl || requestBaseSiteUrl

  const result = await runSocialAutopostNow({ platform: selectedPlatform, baseSiteUrl })

  return {
    success: true,
    data: result
  }
})
