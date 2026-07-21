import { getSocialImageDesignConfig } from '~~/server/utils/social-image-design-config'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const config = await getSocialImageDesignConfig()

  return {
    success: true,
    data: {
      background: config.background,
      theme: config.theme,
      updatedAt: config.updatedAt
    }
  }
})
