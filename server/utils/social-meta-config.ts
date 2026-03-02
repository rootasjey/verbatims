import { useStorage } from 'nitropack/runtime/internal/storage'

const META_SOCIAL_CONFIG_KEY = 'social:meta:credentials:v1'
const META_OAUTH_APP_CONFIG_KEY = 'social:meta:oauth:app-config:v1'

function getKvStorage() {
  return useStorage('kv')
}

export interface MetaSocialCredentials {
  updatedAt: string
  instagram?: {
    accessToken?: string
    userId?: string
    username?: string
    expiresAt?: string
  }
  threads?: {
    accessToken?: string
    userId?: string
    username?: string
    expiresAt?: string
  }
  facebook?: {
    pageId?: string
    pageName?: string
    pageAccessToken?: string
    perms?: string[]
  }
}

export interface ResolvedInstagramConfig {
  accessToken: string
  userId: string
  source: 'kv' | 'env' | 'none'
  expiresAt?: string
}

export interface ResolvedFacebookConfig {
  pageAccessToken: string
  pageId: string
  source: 'kv' | 'env' | 'none'
}

export interface ResolvedThreadsConfig {
  accessToken: string
  userId: string
  source: 'kv' | 'env' | 'none'
  expiresAt?: string
}

export interface MetaOAuthAppConfig {
  updatedAt: string
  appId?: string
  appSecret?: string
  redirectUri?: string
}

export interface ResolvedMetaOAuthConfig {
  appId: string
  appSecret: string
  redirectUri: string
  appIdSource: 'kv' | 'env' | 'none'
  appSecretSource: 'kv' | 'env' | 'none'
  redirectUriSource: 'kv' | 'env' | 'default'
}

function parseStoredCredentials(raw: unknown): MetaSocialCredentials | null {
  if (!raw || typeof raw !== 'object') return null

  const value = raw as Record<string, any>
  return {
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
    instagram: value.instagram && typeof value.instagram === 'object'
      ? {
          accessToken: typeof value.instagram.accessToken === 'string' ? value.instagram.accessToken : undefined,
          userId: typeof value.instagram.userId === 'string' ? value.instagram.userId : undefined,
          username: typeof value.instagram.username === 'string' ? value.instagram.username : undefined,
          expiresAt: typeof value.instagram.expiresAt === 'string' ? value.instagram.expiresAt : undefined
        }
      : undefined,
    threads: value.threads && typeof value.threads === 'object'
      ? {
          accessToken: typeof value.threads.accessToken === 'string' ? value.threads.accessToken : undefined,
          userId: typeof value.threads.userId === 'string' ? value.threads.userId : undefined,
          username: typeof value.threads.username === 'string' ? value.threads.username : undefined,
          expiresAt: typeof value.threads.expiresAt === 'string' ? value.threads.expiresAt : undefined
        }
      : undefined,
    facebook: value.facebook && typeof value.facebook === 'object'
      ? {
          pageId: typeof value.facebook.pageId === 'string' ? value.facebook.pageId : undefined,
          pageName: typeof value.facebook.pageName === 'string' ? value.facebook.pageName : undefined,
          pageAccessToken: typeof value.facebook.pageAccessToken === 'string' ? value.facebook.pageAccessToken : undefined,
          perms: Array.isArray(value.facebook.perms)
            ? value.facebook.perms.filter((perm: unknown) => typeof perm === 'string')
            : undefined
        }
      : undefined
  }
}

function parseStoredMetaOAuthAppConfig(raw: unknown): MetaOAuthAppConfig | null {
  if (!raw || typeof raw !== 'object') return null

  const value = raw as Record<string, any>
  return {
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
    appId: typeof value.appId === 'string' ? value.appId : undefined,
    appSecret: typeof value.appSecret === 'string' ? value.appSecret : undefined,
    redirectUri: typeof value.redirectUri === 'string' ? value.redirectUri : undefined
  }
}

export async function getMetaSocialCredentials(): Promise<MetaSocialCredentials | null> {
  try {
    const raw = await getKvStorage().getItem<MetaSocialCredentials>(META_SOCIAL_CONFIG_KEY)
    return parseStoredCredentials(raw)
  } catch {
    return null
  }
}

export async function setMetaSocialCredentials(next: MetaSocialCredentials) {
  await getKvStorage().setItem(META_SOCIAL_CONFIG_KEY, {
    ...next,
    updatedAt: new Date().toISOString()
  })
}

export async function getMetaOAuthAppConfig(): Promise<MetaOAuthAppConfig | null> {
  try {
    const raw = await getKvStorage().getItem<MetaOAuthAppConfig>(META_OAUTH_APP_CONFIG_KEY)
    return parseStoredMetaOAuthAppConfig(raw)
  } catch {
    return null
  }
}

export async function setMetaOAuthAppConfig(next: MetaOAuthAppConfig) {
  await getKvStorage().setItem(META_OAUTH_APP_CONFIG_KEY, {
    ...next,
    updatedAt: new Date().toISOString()
  })
}

export async function resolveMetaOAuthConfig(input?: { origin?: string }): Promise<ResolvedMetaOAuthConfig> {
  const stored = await getMetaOAuthAppConfig()

  const kvAppId = String(stored?.appId || '')
  const envAppId = String(process.env.META_APP_ID || '')
  const appId = kvAppId || envAppId

  const kvAppSecret = String(stored?.appSecret || '')
  const envAppSecret = String(process.env.META_APP_SECRET || '')
  const appSecret = kvAppSecret || envAppSecret

  const kvRedirectUri = String(stored?.redirectUri || '')
  const envRedirectUri = String(process.env.META_REDIRECT_URI || process.env.NUXT_SOCIAL_META_REDIRECT_URI || '')
  const fallbackRedirectUri = `${String(input?.origin || '').replace(/\/$/, '')}/api/admin/social/meta/callback`
  const redirectUri = kvRedirectUri || envRedirectUri || fallbackRedirectUri

  return {
    appId,
    appSecret,
    redirectUri,
    appIdSource: kvAppId ? 'kv' : envAppId ? 'env' : 'none',
    appSecretSource: kvAppSecret ? 'kv' : envAppSecret ? 'env' : 'none',
    redirectUriSource: kvRedirectUri ? 'kv' : envRedirectUri ? 'env' : 'default'
  }
}

export async function resolveInstagramPostConfig(): Promise<ResolvedInstagramConfig> {
  const stored = await getMetaSocialCredentials()

  const kvToken = String(stored?.instagram?.accessToken || '')
  const kvUserId = String(stored?.instagram?.userId || '')
  if (kvToken && kvUserId) {
    return {
      accessToken: kvToken,
      userId: kvUserId,
      source: 'kv',
      expiresAt: stored?.instagram?.expiresAt
    }
  }

  const envToken = String(process.env.NUXT_INSTAGRAM_POST_ACCESS_TOKEN || '')
  const envUserId = String(process.env.NUXT_INSTAGRAM_POST_IG_USER_ID || '')
  if (envToken && envUserId) {
    return {
      accessToken: envToken,
      userId: envUserId,
      source: 'env'
    }
  }

  return {
    accessToken: '',
    userId: '',
    source: 'none'
  }
}

export async function resolveFacebookPostConfig(): Promise<ResolvedFacebookConfig> {
  const stored = await getMetaSocialCredentials()

  const kvToken = String(stored?.facebook?.pageAccessToken || '')
  const kvPageId = String(stored?.facebook?.pageId || '')
  if (kvToken && kvPageId) {
    return {
      pageAccessToken: kvToken,
      pageId: kvPageId,
      source: 'kv'
    }
  }

  const envToken = String(process.env.NUXT_FACEBOOK_POST_ACCESS_TOKEN || '')
  const envPageId = String(process.env.NUXT_FACEBOOK_POST_PAGE_ID || '')
  if (envToken && envPageId) {
    return {
      pageAccessToken: envToken,
      pageId: envPageId,
      source: 'env'
    }
  }

  return {
    pageAccessToken: '',
    pageId: '',
    source: 'none'
  }
}

export async function resolveThreadsPostConfig(): Promise<ResolvedThreadsConfig> {
  const stored = await getMetaSocialCredentials()

  const kvToken = String(stored?.threads?.accessToken || '')
  const kvUserId = String(stored?.threads?.userId || '')
  if (kvToken && kvUserId) {
    return {
      accessToken: kvToken,
      userId: kvUserId,
      source: 'kv',
      expiresAt: stored?.threads?.expiresAt
    }
  }

  const envToken = String(process.env.NUXT_THREADS_POST_ACCESS_TOKEN || '')
  const envUserId = String(process.env.NUXT_THREADS_POST_USER_ID || '')
  if (envToken && envUserId) {
    return {
      accessToken: envToken,
      userId: envUserId,
      source: 'env'
    }
  }

  return {
    accessToken: '',
    userId: '',
    source: 'none'
  }
}
