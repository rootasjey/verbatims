import { useStorage } from 'nitropack/runtime/internal/storage'

const STORAGE_KEY = 'social:image-design:config:v1'

export type SocialImageBgType = 'solid' | 'transparent' | 'author-image' | 'reference-image'
export type SocialImageTheme = 'light' | 'dark'

export interface SocialImageDesignConfigStore {
  background: SocialImageBgType
  theme: SocialImageTheme
  updatedAt: string
}

function getKvStorage() {
  return useStorage('kv')
}

function normalizeStoredConfig(raw: unknown): SocialImageDesignConfigStore | null {
  if (!raw || typeof raw !== 'object') return null

  const value = raw as Record<string, any>

  const background = (['solid', 'transparent', 'author-image', 'reference-image'].includes(value.background) ? value.background : 'solid') as SocialImageBgType
  const theme = (['light', 'dark'].includes(value.theme) ? value.theme : 'light') as SocialImageTheme

  return {
    background,
    theme,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString()
  }
}

export async function getSocialImageDesignConfig(): Promise<SocialImageDesignConfigStore> {
  try {
    const raw = await getKvStorage().getItem<SocialImageDesignConfigStore>(STORAGE_KEY)
    const normalized = normalizeStoredConfig(raw)
    if (normalized) return normalized
  } catch {
    // fall through
  }

  return {
    background: 'solid',
    theme: 'light',
    updatedAt: new Date().toISOString()
  }
}

export async function setSocialImageDesignConfig(input: {
  background: SocialImageBgType
  theme: SocialImageTheme
}): Promise<SocialImageDesignConfigStore> {
  const next: SocialImageDesignConfigStore = {
    background: input.background,
    theme: input.theme,
    updatedAt: new Date().toISOString()
  }

  await getKvStorage().setItem(STORAGE_KEY, next)
  return next
}
