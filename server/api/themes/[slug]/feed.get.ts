export default defineEventHandler(async (event): Promise<ApiResponse<ThemeFeedResult | null>> => {
  try {
    const slug = getRouterParam(event, 'slug')
    if (!slug) {
      throw createError({ statusCode: 400, statusMessage: 'Theme slug is required' })
    }

    const feed = await getThemeFeed(slug)
    if (!feed) {
      throw createError({ statusCode: 404, statusMessage: 'Theme not found' })
    }

    setResponseHeader(event, 'Cache-Control', 'public, max-age=120')

    return { success: true, data: feed }
  } catch (error) {
    if ((error as any).statusCode) throw error
    console.error('Error fetching theme feed:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch theme feed' })
  }
})
