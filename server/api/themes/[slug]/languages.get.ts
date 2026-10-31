import { getThemeFeed } from '~~/server/utils/theme'
import { getThemeForPublicAccess, setThemeResponseCache } from '~~/server/utils/theme-publication'

const contentLanguages = ['en', 'fr', 'la'] as const

export default defineEventHandler(async (event): Promise<ApiResponse<Array<{
  language: typeof contentLanguages[number]
  quote_count: number
}>>> => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throwServer(400, 'Theme slug is required')
  }

  const accessible = await getThemeForPublicAccess(event, slug)
  if (!accessible) throwServer(404, 'Theme not found')
  const feeds = await Promise.all(contentLanguages.map(language => getThemeFeed(slug, language, accessible.isDraftPreview)))
  if (feeds.some(feed => !feed)) {
    throwServer(404, 'Theme not found')
  }

  setThemeResponseCache(event, accessible.isDraftPreview)

  return {
    success: true,
    data: contentLanguages.map((language, index) => ({
      language,
      quote_count: feeds[index]?.total ?? 0,
    })),
  }
})
