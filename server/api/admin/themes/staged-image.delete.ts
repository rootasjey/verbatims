import { deleteStagedThemeImage } from '~~/server/utils/theme-image-storage'

export default defineEventHandler(async (event) => {
  await requireModerator(event)

  const body = await readBody<{ url?: unknown }>(event)
  if (typeof body?.url !== 'string') throwServer(400, 'Image URL is required')

  await deleteStagedThemeImage(body.url)
  return { success: true }
})
