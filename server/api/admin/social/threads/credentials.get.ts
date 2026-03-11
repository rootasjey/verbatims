import { getMetaSocialCredentials, resolveThreadsOAuthConfig, resolveThreadsPostConfig } from '../../../../utils/social-meta-config'

const THREADS_REFRESH_MIN_AGE_MS = 24 * 60 * 60 * 1000

function parseIsoDate(value: string | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const stored = await getMetaSocialCredentials()
  const resolved = await resolveThreadsPostConfig()
  const resolvedOAuth = await resolveThreadsOAuthConfig()

  const envToken = String(process.env.NUXT_THREADS_POST_ACCESS_TOKEN || '')
  const envUserId = String(process.env.NUXT_THREADS_POST_USER_ID || '')
  const kvToken = String(stored?.threads?.accessToken || '')
  const kvUserId = String(stored?.threads?.userId || '')
  const tokenUpdatedAt = String(stored?.threads?.tokenUpdatedAt || '') || null
  const tokenUpdatedDate = parseIsoDate(stored?.threads?.tokenUpdatedAt)
  const expiresAt = resolved.expiresAt || null
  const expiresAtDate = parseIsoDate(resolved.expiresAt)
  const refreshAvailableAt = tokenUpdatedDate
    ? new Date(tokenUpdatedDate.getTime() + THREADS_REFRESH_MIN_AGE_MS).toISOString()
    : null
  const now = Date.now()
  const canRefreshNow = Boolean(resolved.accessToken) && (!refreshAvailableAt || new Date(refreshAvailableAt).getTime() <= now)
  const isExpired = Boolean(expiresAtDate && expiresAtDate.getTime() <= now)
  const isExpiringSoon = Boolean(expiresAtDate && expiresAtDate.getTime() > now && expiresAtDate.getTime() - now <= 7 * 24 * 60 * 60 * 1000)
  const tokenStatus = !resolved.accessToken
    ? 'missing'
    : isExpired
      ? 'expired'
      : isExpiringSoon
        ? 'expiring-soon'
        : 'healthy'

  return {
    success: true,
    data: {
      updatedAt: stored?.updatedAt || null,
      userId: resolved.userId,
      username: String(stored?.threads?.username || ''),
      expiresAt,
      tokenUpdatedAt,
      refreshAvailableAt,
      canRefreshNow,
      tokenStatus,
      redirectUri: resolvedOAuth.redirectUri,
      hasAccessToken: Boolean(resolved.accessToken),
      sources: {
        accessToken: kvToken ? 'kv' : envToken ? 'env' : 'none',
        userId: kvUserId ? 'kv' : envUserId ? 'env' : 'none'
      }
    }
  }
})