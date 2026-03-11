import { readBody } from 'h3'
import { getMetaSocialCredentials, resolveThreadsPostConfig, setMetaSocialCredentials } from '../../../../utils/social-meta-config'

type ThreadsProfilePayload = {
  id?: string
  username?: string
  error?: {
    message?: string
  }
}

async function fetchThreadsProfile(accessToken: string) {
  const baseUrl = String(process.env.NUXT_THREADS_POST_BASE_URL || 'https://graph.threads.net').replace(/\/$/, '')
  const apiVersion = String(process.env.NUXT_THREADS_POST_API_VERSION || 'v1.0').replace(/^\/+/, '')
  const requestUrl = new URL(`${baseUrl}/${apiVersion}/me`)
  requestUrl.searchParams.set('fields', 'id,username')
  requestUrl.searchParams.set('access_token', accessToken)

  const response = await fetch(requestUrl)
  const payload = await response.json().catch(() => null) as ThreadsProfilePayload | null

  if (!response.ok || payload?.error) {
    throw createError({
      statusCode: 400,
      statusMessage: payload?.error?.message || `Threads API error (${response.status})`
    })
  }

  const userId = String(payload?.id || '').trim()
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'Threads API did not return a user ID for this token' })
  }

  return {
    userId,
    username: String(payload?.username || '').trim()
  }
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody(event)
  const stored = await getMetaSocialCredentials()
  const resolved = await resolveThreadsPostConfig()

  const incomingAccessToken = typeof body?.accessToken === 'string' ? body.accessToken.trim() : ''
  const incomingUserId = typeof body?.userId === 'string' ? body.userId.trim() : ''

  const nextAccessToken = incomingAccessToken || resolved.accessToken
  if (!nextAccessToken) {
    throw createError({ statusCode: 400, statusMessage: 'Threads access token is required' })
  }

  const profile = await fetchThreadsProfile(nextAccessToken)
  if (incomingUserId && incomingUserId !== profile.userId) {
    throw createError({
      statusCode: 400,
      statusMessage: `Threads user ID does not match the supplied token (expected ${profile.userId})`
    })
  }

  await setMetaSocialCredentials({
    updatedAt: new Date().toISOString(),
    instagram: stored?.instagram,
    threads: {
      accessToken: nextAccessToken,
      userId: incomingUserId || profile.userId,
      username: profile.username || String(stored?.threads?.username || ''),
      expiresAt: incomingAccessToken ? undefined : stored?.threads?.expiresAt,
      tokenUpdatedAt: incomingAccessToken ? new Date().toISOString() : stored?.threads?.tokenUpdatedAt
    },
    facebook: stored?.facebook
  })

  const refreshed = await resolveThreadsPostConfig()

  return {
    success: true,
    data: {
      userId: refreshed.userId,
      username: profile.username || String(stored?.threads?.username || ''),
      expiresAt: refreshed.expiresAt || null,
      tokenUpdatedAt: incomingAccessToken ? new Date().toISOString() : stored?.threads?.tokenUpdatedAt || null,
      hasAccessToken: Boolean(refreshed.accessToken),
      sources: {
        accessToken: refreshed.source,
        userId: refreshed.source
      }
    }
  }
})