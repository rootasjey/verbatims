import { getThemeFeed } from '~~/server/utils/theme'

const contentLanguages = ['en', 'fr', 'la'] as const

export default defineEventHandler(async (event): Promise<ApiResponse<Array<{
  language: typeof contentLanguages[number]
  quote_count: number
}>>> => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throwServer(400, 'Theme slug is required')
  }

  const feeds = await Promise.all(contentLanguages.map(language => getThemeFeed(slug, language)))
  if (feeds.some(feed => !feed)) {
    throwServer(404, 'Theme not found')
  }

  setResponseHeader(event, 'Cache-Control', 'public, max-age=120')

  return {
    success: true,
    data: contentLanguages.map((language, index) => ({
      language,
      quote_count: feeds[index]?.total ?? 0,
    })),
  }
})
