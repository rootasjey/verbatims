import { useStorage } from 'nitropack/runtime/internal/storage'

const SOCIAL_PROVIDER_CONFIG_KEY = 'social:providers:config:v1'

type Source = 'kv' | 'env' | 'default' | 'none'

type RuntimeConfigInput = Record<string, any> | undefined

export type EditableSocialProvider = 'x' | 'bluesky' | 'pinterest' | 'instagram' | 'threads' | 'facebook'

export interface SocialProviderConfigStore {
  updatedAt: string
  x?: {
    enabled?: boolean
    oauth2AccessToken?: string
    oauth1ConsumerKey?: string
    oauth1ConsumerSecret?: string
    oauth1AccessToken?: string
    oauth1AccessTokenSecret?: string
    requireMedia?: boolean
  }
  bluesky?: {
    enabled?: boolean
    service?: string
    identifier?: string
    password?: string
  }
  pinterest?: {
    enabled?: boolean
    accessToken?: string
    boardId?: string
    baseUrl?: string
    apiVersion?: string
  }
  instagram?: {
    enabled?: boolean
  }
  threads?: {
    enabled?: boolean
  }
  facebook?: {
    enabled?: boolean
  }
}

export interface ResolvedXProviderConfig {
  enabled: boolean
  oauth2AccessToken: string
  oauth1ConsumerKey: string
  oauth1ConsumerSecret: string
  oauth1AccessToken: string
  oauth1AccessTokenSecret: string
  requireMedia: boolean
  sources: {
    enabled: Source
    oauth2AccessToken: Source
    oauth1ConsumerKey: Source
    oauth1ConsumerSecret: Source
    oauth1AccessToken: Source
    oauth1AccessTokenSecret: Source
    requireMedia: Source
  }
}

export interface ResolvedBlueskyProviderConfig {
  enabled: boolean
  service: string
  identifier: string
  password: string
  sources: {
    enabled: Source
    service: Source
    identifier: Source
    password: Source
  }
}

export interface ResolvedPinterestProviderConfig {
  enabled: boolean
  accessToken: string
  boardId: string
  baseUrl: string
  apiVersion: string
  sources: {
    enabled: Source
    accessToken: Source
    boardId: Source
    baseUrl: Source
    apiVersion: Source
  }
}

export interface ResolvedSimpleEnabledProviderConfig {
  enabled: boolean
  sources: {
    enabled: Source
  }
}

function getKvStorage() {
  return useStorage('kv')
}

function normalizeStoredConfig(raw: unknown): SocialProviderConfigStore | null {
  if (!raw || typeof raw !== 'object') return null

  const value = raw as Record<string, any>

  return {
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
    x: value.x && typeof value.x === 'object'
      ? {
          enabled: typeof value.x.enabled === 'boolean' ? value.x.enabled : undefined,
          oauth2AccessToken: typeof value.x.oauth2AccessToken === 'string' ? value.x.oauth2AccessToken : undefined,
          oauth1ConsumerKey: typeof value.x.oauth1ConsumerKey === 'string' ? value.x.oauth1ConsumerKey : undefined,
          oauth1ConsumerSecret: typeof value.x.oauth1ConsumerSecret === 'string' ? value.x.oauth1ConsumerSecret : undefined,
          oauth1AccessToken: typeof value.x.oauth1AccessToken === 'string' ? value.x.oauth1AccessToken : undefined,
          oauth1AccessTokenSecret: typeof value.x.oauth1AccessTokenSecret === 'string' ? value.x.oauth1AccessTokenSecret : undefined,
          requireMedia: typeof value.x.requireMedia === 'boolean' ? value.x.requireMedia : undefined
        }
      : undefined,
    bluesky: value.bluesky && typeof value.bluesky === 'object'
      ? {
          enabled: typeof value.bluesky.enabled === 'boolean' ? value.bluesky.enabled : undefined,
          service: typeof value.bluesky.service === 'string' ? value.bluesky.service : undefined,
          identifier: typeof value.bluesky.identifier === 'string' ? value.bluesky.identifier : undefined,
          password: typeof value.bluesky.password === 'string' ? value.bluesky.password : undefined
        }
      : undefined,
    pinterest: value.pinterest && typeof value.pinterest === 'object'
      ? {
          enabled: typeof value.pinterest.enabled === 'boolean' ? value.pinterest.enabled : undefined,
          accessToken: typeof value.pinterest.accessToken === 'string' ? value.pinterest.accessToken : undefined,
          boardId: typeof value.pinterest.boardId === 'string' ? value.pinterest.boardId : undefined,
          baseUrl: typeof value.pinterest.baseUrl === 'string' ? value.pinterest.baseUrl : undefined,
          apiVersion: typeof value.pinterest.apiVersion === 'string' ? value.pinterest.apiVersion : undefined
        }
      : undefined,
    instagram: value.instagram && typeof value.instagram === 'object'
      ? {
          enabled: typeof value.instagram.enabled === 'boolean' ? value.instagram.enabled : undefined
        }
      : undefined,
    threads: value.threads && typeof value.threads === 'object'
      ? {
          enabled: typeof value.threads.enabled === 'boolean' ? value.threads.enabled : undefined
        }
      : undefined,
    facebook: value.facebook && typeof value.facebook === 'object'
      ? {
          enabled: typeof value.facebook.enabled === 'boolean' ? value.facebook.enabled : undefined
        }
      : undefined
  }
}

export function isEditableSocialProvider(value: string): value is EditableSocialProvider {
  return value === 'x'
    || value === 'bluesky'
    || value === 'pinterest'
    || value === 'instagram'
    || value === 'threads'
    || value === 'facebook'
}

export async function getSocialProviderConfigStore(): Promise<SocialProviderConfigStore | null> {
  try {
    const raw = await getKvStorage().getItem<SocialProviderConfigStore>(SOCIAL_PROVIDER_CONFIG_KEY)
    return normalizeStoredConfig(raw)
  } catch {
    return null
  }
}

export async function setSocialProviderConfigStore(next: SocialProviderConfigStore) {
  await getKvStorage().setItem(SOCIAL_PROVIDER_CONFIG_KEY, {
    ...next,
    updatedAt: new Date().toISOString()
  })
}

export async function updateSocialProviderConfigStore(input: {
  platform: EditableSocialProvider
  values: Record<string, any>
}) {
  const stored = await getSocialProviderConfigStore()
  const base: SocialProviderConfigStore = {
    updatedAt: stored?.updatedAt || new Date().toISOString(),
    x: stored?.x,
    bluesky: stored?.bluesky,
    pinterest: stored?.pinterest,
    instagram: stored?.instagram,
    threads: stored?.threads,
    facebook: stored?.facebook
  }

  if (input.platform === 'x') {
    base.x = {
      enabled: typeof input.values.enabled === 'boolean' ? input.values.enabled : base.x?.enabled,
      oauth2AccessToken: normalizeOptionalString(input.values.oauth2AccessToken),
      oauth1ConsumerKey: normalizeOptionalString(input.values.oauth1ConsumerKey),
      oauth1ConsumerSecret: normalizeOptionalString(input.values.oauth1ConsumerSecret),
      oauth1AccessToken: normalizeOptionalString(input.values.oauth1AccessToken),
      oauth1AccessTokenSecret: normalizeOptionalString(input.values.oauth1AccessTokenSecret),
      requireMedia: typeof input.values.requireMedia === 'boolean' ? input.values.requireMedia : base.x?.requireMedia
    }
  }

  if (input.platform === 'bluesky') {
    base.bluesky = {
      enabled: typeof input.values.enabled === 'boolean' ? input.values.enabled : base.bluesky?.enabled,
      service: normalizeOptionalString(input.values.service),
      identifier: normalizeOptionalString(input.values.identifier),
      password: normalizeOptionalString(input.values.password)
    }
  }

  if (input.platform === 'pinterest') {
    base.pinterest = {
      enabled: typeof input.values.enabled === 'boolean' ? input.values.enabled : base.pinterest?.enabled,
      accessToken: normalizeOptionalString(input.values.accessToken),
      boardId: normalizeOptionalString(input.values.boardId),
      baseUrl: normalizeOptionalString(input.values.baseUrl),
      apiVersion: normalizeOptionalString(input.values.apiVersion)
    }
  }

  if (input.platform === 'instagram') {
    base.instagram = {
      enabled: typeof input.values.enabled === 'boolean' ? input.values.enabled : base.instagram?.enabled
    }
  }

  if (input.platform === 'threads') {
    base.threads = {
      enabled: typeof input.values.enabled === 'boolean' ? input.values.enabled : base.threads?.enabled
    }
  }

  if (input.platform === 'facebook') {
    base.facebook = {
      enabled: typeof input.values.enabled === 'boolean' ? input.values.enabled : base.facebook?.enabled
    }
  }

  await setSocialProviderConfigStore(base)
  return base
}

function resolveBooleanField(input: {
  kv: boolean | undefined
  envRaw: string | undefined
  fallback: boolean
}): { value: boolean, source: Source } {
  if (typeof input.kv === 'boolean') {
    return { value: input.kv, source: 'kv' }
  }

  const envValue = parseBooleanEnv(input.envRaw)
  if (typeof envValue === 'boolean') {
    return { value: envValue, source: 'env' }
  }

  return { value: input.fallback, source: 'default' }
}

function parseBooleanEnv(raw: string | undefined): boolean | null {
  if (typeof raw !== 'string') return null
  const normalized = raw.trim().toLowerCase()
  if (!normalized) return null
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return null
}

function resolveStringField(input: {
  kv: string | undefined
  env: string
  fallback: string
  hasDefault?: boolean
}): { value: string, source: Source } {
  const kvValue = String(input.kv || '').trim()
  if (kvValue) {
    return { value: kvValue, source: 'kv' }
  }

  const envValue = String(input.env || '').trim()
  if (envValue) {
    return { value: envValue, source: 'env' }
  }

  const fallbackValue = String(input.fallback || '').trim()
  if (fallbackValue) {
    return { value: fallbackValue, source: input.hasDefault ? 'default' : 'none' }
  }

  return { value: '', source: 'none' }
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function getRuntimeConfigSafe() {
  try {
    return useRuntimeConfig() as Record<string, any>
  } catch {
    return undefined
  }
}

export async function resolveXProviderConfig(): Promise<ResolvedXProviderConfig> {
  const stored = await getSocialProviderConfigStore()
  const fromEnabled = resolveBooleanField({
    kv: stored?.x?.enabled,
    envRaw: process.env.NUXT_X_POST_ENABLED,
    fallback: true
  })
  const fromRequireMedia = resolveBooleanField({
    kv: stored?.x?.requireMedia,
    envRaw: process.env.NUXT_X_POST_REQUIRE_MEDIA,
    fallback: false
  })

  const oauth2FromPrimary = String(process.env.NUXT_X_POST_ACCESS_TOKEN || '').trim()
  const oauth2FromLegacy = String(process.env.NUXT_X_POST_BEARER_TOKEN || '').trim()
  const oauth2 = resolveStringField({
    kv: stored?.x?.oauth2AccessToken,
    env: oauth2FromPrimary || oauth2FromLegacy,
    fallback: ''
  })

  const oauth1ConsumerKey = resolveStringField({
    kv: stored?.x?.oauth1ConsumerKey,
    env: String(process.env.NUXT_X_POST_OAUTH1_CONSUMER_KEY || ''),
    fallback: ''
  })
  const oauth1ConsumerSecret = resolveStringField({
    kv: stored?.x?.oauth1ConsumerSecret,
    env: String(process.env.NUXT_X_POST_OAUTH1_CONSUMER_SECRET || ''),
    fallback: ''
  })
  const oauth1AccessToken = resolveStringField({
    kv: stored?.x?.oauth1AccessToken,
    env: String(process.env.NUXT_X_POST_OAUTH1_ACCESS_TOKEN || ''),
    fallback: ''
  })
  const oauth1AccessTokenSecret = resolveStringField({
    kv: stored?.x?.oauth1AccessTokenSecret,
    env: String(process.env.NUXT_X_POST_OAUTH1_ACCESS_TOKEN_SECRET || ''),
    fallback: ''
  })

  return {
    enabled: fromEnabled.value,
    oauth2AccessToken: oauth2.value,
    oauth1ConsumerKey: oauth1ConsumerKey.value,
    oauth1ConsumerSecret: oauth1ConsumerSecret.value,
    oauth1AccessToken: oauth1AccessToken.value,
    oauth1AccessTokenSecret: oauth1AccessTokenSecret.value,
    requireMedia: fromRequireMedia.value,
    sources: {
      enabled: fromEnabled.source,
      oauth2AccessToken: oauth2.source,
      oauth1ConsumerKey: oauth1ConsumerKey.source,
      oauth1ConsumerSecret: oauth1ConsumerSecret.source,
      oauth1AccessToken: oauth1AccessToken.source,
      oauth1AccessTokenSecret: oauth1AccessTokenSecret.source,
      requireMedia: fromRequireMedia.source
    }
  }
}

export async function resolveBlueskyProviderConfig(): Promise<ResolvedBlueskyProviderConfig> {
  const stored = await getSocialProviderConfigStore()

  const enabled = resolveBooleanField({
    kv: stored?.bluesky?.enabled,
    envRaw: process.env.NUXT_BLUESKY_POST_ENABLED,
    fallback: false
  })

  const service = resolveStringField({
    kv: stored?.bluesky?.service,
    env: String(process.env.NUXT_BLUESKY_POST_SERVICE || ''),
    fallback: 'https://bsky.social',
    hasDefault: true
  })

  const identifier = resolveStringField({
    kv: stored?.bluesky?.identifier,
    env: String(process.env.NUXT_BLUESKY_POST_IDENTIFIER || ''),
    fallback: ''
  })

  const password = resolveStringField({
    kv: stored?.bluesky?.password,
    env: String(process.env.NUXT_BLUESKY_POST_PASSWORD || ''),
    fallback: ''
  })

  return {
    enabled: enabled.value,
    service: service.value.replace(/\/$/, ''),
    identifier: identifier.value,
    password: password.value,
    sources: {
      enabled: enabled.source,
      service: service.source,
      identifier: identifier.source,
      password: password.source
    }
  }
}

export async function resolvePinterestProviderConfig(input?: {
  runtimeConfig?: RuntimeConfigInput
}): Promise<ResolvedPinterestProviderConfig> {
  const stored = await getSocialProviderConfigStore()
  const runtimeConfig = input?.runtimeConfig || getRuntimeConfigSafe()

  const enabled = resolveBooleanField({
    kv: stored?.pinterest?.enabled,
    envRaw: process.env.NUXT_PINTEREST_POST_ENABLED,
    fallback: false
  })

  const accessToken = resolveStringField({
    kv: stored?.pinterest?.accessToken,
    env: String(process.env.NUXT_PINTEREST_POST_ACCESS_TOKEN || runtimeConfig?.pinterestPostAccessToken || ''),
    fallback: ''
  })

  const boardId = resolveStringField({
    kv: stored?.pinterest?.boardId,
    env: String(process.env.NUXT_PINTEREST_POST_BOARD_ID || runtimeConfig?.pinterestPostBoardId || ''),
    fallback: ''
  })

  const baseUrl = resolveStringField({
    kv: stored?.pinterest?.baseUrl,
    env: String(process.env.NUXT_PINTEREST_POST_BASE_URL || runtimeConfig?.pinterestPostBaseUrl || ''),
    fallback: 'https://api.pinterest.com',
    hasDefault: true
  })

  const apiVersion = resolveStringField({
    kv: stored?.pinterest?.apiVersion,
    env: String(process.env.NUXT_PINTEREST_POST_API_VERSION || runtimeConfig?.pinterestPostApiVersion || ''),
    fallback: 'v5',
    hasDefault: true
  })

  return {
    enabled: enabled.value,
    accessToken: accessToken.value,
    boardId: boardId.value,
    baseUrl: baseUrl.value.replace(/\/$/, ''),
    apiVersion: apiVersion.value.replace(/^\/+/, '').replace(/\/$/, ''),
    sources: {
      enabled: enabled.source,
      accessToken: accessToken.source,
      boardId: boardId.source,
      baseUrl: baseUrl.source,
      apiVersion: apiVersion.source
    }
  }
}

export async function resolveInstagramEnabledConfig(): Promise<ResolvedSimpleEnabledProviderConfig> {
  const stored = await getSocialProviderConfigStore()
  const enabled = resolveBooleanField({
    kv: stored?.instagram?.enabled,
    envRaw: process.env.NUXT_INSTAGRAM_POST_ENABLED,
    fallback: false
  })

  return {
    enabled: enabled.value,
    sources: {
      enabled: enabled.source
    }
  }
}

export async function resolveThreadsEnabledConfig(): Promise<ResolvedSimpleEnabledProviderConfig> {
  const stored = await getSocialProviderConfigStore()
  const enabled = resolveBooleanField({
    kv: stored?.threads?.enabled,
    envRaw: process.env.NUXT_THREADS_POST_ENABLED,
    fallback: false
  })

  return {
    enabled: enabled.value,
    sources: {
      enabled: enabled.source
    }
  }
}

export async function resolveFacebookEnabledConfig(): Promise<ResolvedSimpleEnabledProviderConfig> {
  const stored = await getSocialProviderConfigStore()
  const enabled = resolveBooleanField({
    kv: stored?.facebook?.enabled,
    envRaw: process.env.NUXT_FACEBOOK_POST_ENABLED,
    fallback: false
  })

  return {
    enabled: enabled.value,
    sources: {
      enabled: enabled.source
    }
  }
}
