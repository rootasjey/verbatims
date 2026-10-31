import { getThemeFeed } from '~~/server/utils/theme'
import { getThemeForPublicAccess, setThemeResponseCache } from '~~/server/utils/theme-publication'

export default defineEventHandler(async (event): Promise<ApiResponse<ThemeFeedResult | null>> => {
  try {
    const slug = getRouterParam(event, 'slug')!
    if (!slug) {
      throwServer(400, 'Theme slug is required')
    }

    const query = getQuery(event)
    const language = (query.language as string) || undefined
    const accessible = await getThemeForPublicAccess(event, slug!)
    if (!accessible) throwServer(404, 'Theme not found')

    const feed = await getThemeFeed(slug!, language, accessible.isDraftPreview)
    if (!feed) {
      throwServer(404, 'Theme not found')
    }

    setThemeResponseCache(event, accessible.isDraftPreview)

    return { success: true, data: feed! }
  } catch (error) {
    if ((error as any).statusCode) throw error
    const msg = (error as any)?.message || String(error)
    console.error('Error fetching theme feed:', msg)
    throwServer(500, msg)
  }
})
