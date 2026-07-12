export default defineEventHandler(async (event): Promise<ApiResponse<{
  slug: string
  name: string
  description: string | null
  image_url: string | null
  config: Record<string, any> | null
  filters_count: number
} | null>> => {
  try {
    const query = getQuery(event)
    const language = (query.language as string) || undefined
    const theme = await resolveActiveTheme(language)
    if (!theme) {
      return { success: true, data: null }
    }

    let config: Record<string, any> | null = null
    if (theme.config) {
      try { config = JSON.parse(theme.config) } catch { config = null }
    }

    if (config) {
      const colorNameToHex: Record<string, string> = {
        rose: '#f43f5e', pink: '#ec4899', fuchsia: '#d946ef',
        purple: '#a855f7', violet: '#8b5cf6', indigo: '#6366f1',
        blue: '#3b82f6', sky: '#0ea5e9', cyan: '#06b6d4',
        teal: '#14b8a6', emerald: '#10b981', green: '#22c55e',
        lime: '#84cc16', yellow: '#eab308', amber: '#f59e0b',
        orange: '#f97316', red: '#ef4444',
        slate: '#64748b', gray: '#6b7280', zinc: '#71717a',
        neutral: '#737373', stone: '#78716c',
      }
      if (config.color_primary && !config.color_primary.startsWith('#')) {
        config.color_primary = colorNameToHex[config.color_primary] || config.color_primary
      }
      if (config.color_secondary && !config.color_secondary.startsWith('#')) {
        config.color_secondary = colorNameToHex[config.color_secondary] || config.color_secondary
      }
    }

    const [filters, translations] = await Promise.all([
      getThemeFilters(theme.id),
      getThemeTranslations(theme.id),
    ])

    const localized = resolveLocalizedField(translations, language, theme.name, theme.description)

    return {
      success: true,
      data: {
        slug: theme.slug,
        name: localized.name,
        description: localized.description,
        image_url: theme.image_url,
        config,
        filters_count: filters.length,
      },
    }
  } catch (error) {
    console.error('Error resolving active theme:', error)
    throwServer(500, 'Failed to resolve active theme')
  }
})
