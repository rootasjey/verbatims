export default defineEventHandler(async (_event): Promise<ApiResponse<{
  slug: string
  name: string
  description: string | null
  image_url: string | null
  config: Record<string, any> | null
  filters_count: number
} | null>> => {
  try {
    const theme = await resolveActiveTheme()
    if (!theme) {
      return { success: true, data: null }
    }

    let config: Record<string, any> | null = null
    if (theme.config) {
      try { config = JSON.parse(theme.config) } catch { config = null }
    }

    const filters = await getThemeFilters(theme.id)

    return {
      success: true,
      data: {
        slug: theme.slug,
        name: theme.name,
        description: theme.description,
        image_url: theme.image_url,
        config,
        filters_count: filters.length,
      },
    }
  } catch (error) {
    console.error('Error resolving active theme:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to resolve active theme' })
  }
})
