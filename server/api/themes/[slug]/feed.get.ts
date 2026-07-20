export default defineEventHandler(async (event): Promise<ApiResponse<ThemeFeedResult | null>> => {
  try {
    const slug = getRouterParam(event, 'slug')!
    if (!slug) {
      throwServer(400, 'Theme slug is required')
    }

    const query = getQuery(event)
    const language = (query.language as string) || undefined

    const feed = await getThemeFeed(slug!, language)
    if (!feed) {
      throwServer(404, 'Theme not found')
    }

    setResponseHeader(event, 'Cache-Control', 'public, max-age=120')

    return { success: true, data: feed! }
  } catch (error) {
    if ((error as any).statusCode) throw error
    const msg = (error as any)?.message || String(error)
    console.error('Error fetching theme feed:', msg)
    throwServer(500, msg)
  }
})
