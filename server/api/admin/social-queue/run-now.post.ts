import { runSocialAutopostNow } from '../../../utils/social-queue-api'
import type { SocialPlatform } from '#shared/constants/social'
import { isSocialPlatform, SOCIAL_PLATFORM_ERROR_MESSAGE } from '#shared/constants/social'
import { resolveAppOrigin } from '../../../utils/app-origin'

export default defineEventHandler(async (event) => {
  await requireModerator(event)

  const body = await readBody(event)
  const platform = body?.platform ? String(body.platform) : undefined

  if (platform && !isSocialPlatform(platform)) {
    throwServer(400, SOCIAL_PLATFORM_ERROR_MESSAGE)
  }

  const selectedPlatform: SocialPlatform | undefined = platform && isSocialPlatform(platform)
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
