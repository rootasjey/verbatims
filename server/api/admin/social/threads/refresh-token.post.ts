import { getMetaSocialCredentials, resolveThreadsPostConfig, setMetaSocialCredentials } from '../../../../utils/social-meta-config'

type ThreadsRefreshPayload = {
  access_token?: string
  expires_in?: number
  error?: {
    message?: string
  }
  error_message?: string
}

type ThreadsProfilePayload = {
  id?: string
  username?: string
  error?: {
    message?: string
  }
  error_message?: string
}

async function refreshLongLivedToken(accessToken: string) {
  const requestUrl = new URL('https://graph.threads.net/refresh_access_token')
  requestUrl.searchParams.set('grant_type', 'th_refresh_token')
  requestUrl.searchParams.set('access_token', accessToken)

  const response = await fetch(requestUrl)
  const payload = await response.json().catch(() => null) as ThreadsRefreshPayload | null
  if (!response.ok || payload?.error || payload?.error_message) {
    throw createError({
      statusCode: 400,
      statusMessage: payload?.error?.message || payload?.error_message || `Threads refresh error (${response.status})`
    })
  }

  const nextToken = String(payload?.access_token || '')
  if (!nextToken) {
    throw createError({ statusCode: 400, statusMessage: 'Threads refresh did not return a token' })
  }

  const expiresIn = Number(payload?.expires_in || 0)
  return {
    accessToken: nextToken,
    expiresAt: Number.isFinite(expiresIn) && expiresIn > 0
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : undefined
  }
}

async function fetchThreadsProfile(accessToken: string) {
  const requestUrl = new URL('https://graph.threads.net/v1.0/me')
  requestUrl.searchParams.set('fields', 'id,username')
  requestUrl.searchParams.set('access_token', accessToken)

  const response = await fetch(requestUrl)
  const payload = await response.json().catch(() => null) as ThreadsProfilePayload | null
  if (!response.ok || payload?.error || payload?.error_message) {
    throw createError({
      statusCode: 400,
      statusMessage: payload?.error?.message || payload?.error_message || `Threads profile error (${response.status})`
    })
  }

  return {
    userId: String(payload?.id || '').trim(),
    username: String(payload?.username || '').trim()
  }
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const stored = await getMetaSocialCredentials()
  const resolved = await resolveThreadsPostConfig()
  if (!resolved.accessToken) {
    throw createError({ statusCode: 400, statusMessage: 'Threads access token is required before it can be refreshed' })
  }

  const refreshed = await refreshLongLivedToken(resolved.accessToken)
  const profile = await fetchThreadsProfile(refreshed.accessToken)

  await setMetaSocialCredentials({
    updatedAt: new Date().toISOString(),
    instagram: stored?.instagram,
    threads: {
      accessToken: refreshed.accessToken,
      userId: profile.userId || String(stored?.threads?.userId || resolved.userId || ''),
      username: profile.username || String(stored?.threads?.username || ''),
      expiresAt: refreshed.expiresAt,
      tokenUpdatedAt: new Date().toISOString()
    },
    facebook: stored?.facebook
  })

  return {
    success: true,
    data: {
      userId: profile.userId,
      username: profile.username,
      expiresAt: refreshed.expiresAt || null,
      refreshedAt: new Date().toISOString()
    }
  }
})