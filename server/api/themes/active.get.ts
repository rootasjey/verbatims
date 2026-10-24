import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { parseThemeHomeCopy } from '~~/server/utils/theme'
import type { ThemeHomeCopy } from '~~/shared/types/theme'

export default defineEventHandler(async (event): Promise<ApiResponse<{
  id: number
  slug: string
  name: string
  description: string | null
  image_url: string | null
  image_alt: string | null
  image_credit: string | null
  image_source_url: string | null
  image_license: string | null
  image_date: string | null
  image_location: string | null
  mobile_image_url: string | null
  mobile_image_alt: string | null
  mobile_image_credit: string | null
  mobile_image_source_url: string | null
  mobile_image_license: string | null
  mobile_image_date: string | null
  mobile_image_location: string | null
  config: Record<string, any> | null
  home_copy: ThemeHomeCopy | null
  filters_count: number
} | null>> => {
  try {
    const query = getQuery(event)
    const language = (query.language as string) || undefined
    const themeSlug = query.theme as string | undefined

    let theme
    if (themeSlug) {
      const [found] = await db.select().from(schema.themes).where(eq(schema.themes.slug, themeSlug)).limit(1)
      theme = found || null
    } else {
      theme = await resolveActiveTheme(language)
    }
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
    const localizedTranslation = language ? translations.find(t => t.language === language) : undefined

    return {
      success: true,
      data: {
        id: theme.id,
        slug: theme.slug,
        name: localized.name,
        description: localized.description,
        image_url: theme.imageUrl,
        image_alt: theme.imageAlt,
        image_credit: theme.imageCredit,
        image_source_url: theme.imageSourceUrl,
        image_license: theme.imageLicense,
        image_date: theme.imageDate,
        image_location: theme.imageLocation,
        mobile_image_url: theme.mobileImageUrl,
        mobile_image_alt: theme.mobileImageAlt,
        mobile_image_credit: theme.mobileImageCredit,
        mobile_image_source_url: theme.mobileImageSourceUrl,
        mobile_image_license: theme.mobileImageLicense,
        mobile_image_date: theme.mobileImageDate,
        mobile_image_location: theme.mobileImageLocation,
        config,
        home_copy: parseThemeHomeCopy(localizedTranslation?.homeCopy),
        filters_count: filters.length,
      },
    }
  } catch (error) {
    console.error('Error resolving active theme:', error)
    throwServer(500, 'Failed to resolve active theme')
  }
})
