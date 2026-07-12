export interface ThemeTranslation {
  id: number
  theme_id: number
  language: string
  name: string
  description: string | null
}

export interface Theme {
  id: number
  slug: string
  name: string
  description: string | null
  language: string | null
  image_url: string | null
  config: Record<string, any> | null
  is_active: boolean
  is_default: boolean
  scheduled_date: string | null
  scheduled_start: string | null
  scheduled_end: string | null
  priority: number
  created_at: string
  updated_at: string
  filters?: ThemeContentFilter[]
  translations?: ThemeTranslation[]
}

export interface ThemeContentFilter {
  id: number
  theme_id: number
  type: 'keyword' | 'tag_name' | 'author_name' | 'reference_name' | 'author_id' | 'reference_id' | 'language'
  value: string
  match_mode: 'any' | 'all'
}

export interface CreateThemeTranslationData {
  language: string
  name: string
  description?: string | null
}

export interface CreateThemeData {
  slug: string
  name: string
  description?: string | null
  language?: string | null
  translations?: CreateThemeTranslationData[]
  image_url?: string | null
  config?: Record<string, any>
  is_active?: boolean
  is_default?: boolean
  scheduled_date?: string | null
  scheduled_start?: string | null
  scheduled_end?: string | null
  priority?: number
}

export interface UpdateThemeData extends Partial<CreateThemeData> {
  id: number
}
