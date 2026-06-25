export default defineEventHandler(async (event): Promise<ApiResponse<ThemeFeedResult | null>> => {
  try {
    const slug = getRouterParam(event, 'slug')!
    if (!slug) {
      throwServer(400, 'Theme slug is required')
    }

    const feed = await getThemeFeed(slug!)
    if (!feed) {
      throwServer(404, 'Theme not found')
    }

    setResponseHeader(event, 'Cache-Control', 'public, max-age=120')

    return { success: true, data: feed! }
  } catch (error) {
    if ((error as any).statusCode) throw error
    console.error('Error fetching theme feed:', error)
    throwServer(500, 'Failed to fetch theme feed')
  }
})
