import { setSocialImageDesignConfig } from '~~/server/utils/social-image-design-config'
import type { SocialImageBgType, SocialImageTheme } from '~~/server/utils/social-image-design-config'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  if (!body) { throwServer(400, 'Request body is required'); return }

  const background = body.background as SocialImageBgType
  const theme = body.theme as SocialImageTheme

  if (!['solid', 'transparent', 'author-image', 'reference-image'].includes(background)) {
    throwServer(400, 'Invalid background. Must be one of: solid, transparent, author-image, reference-image'); return
  }

  if (!['light', 'dark'].includes(theme)) {
    throwServer(400, 'Invalid theme. Must be one of: light, dark'); return
  }

  const config = await setSocialImageDesignConfig({ background, theme })

  return {
    success: true,
    data: {
      background: config.background,
      theme: config.theme,
      updatedAt: config.updatedAt
    }
  }
})
