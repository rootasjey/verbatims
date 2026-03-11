import { readBody } from 'h3'
import { getThreadsOAuthAppConfig, resolveThreadsOAuthConfig, setThreadsOAuthAppConfig } from '../../../../utils/social-meta-config'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody(event)
  const stored = await getThreadsOAuthAppConfig()

  const incomingAppId = typeof body?.appId === 'string' ? body.appId.trim() : ''
  const incomingAppSecret = typeof body?.appSecret === 'string' ? body.appSecret.trim() : ''
  const incomingRedirectUri = typeof body?.redirectUri === 'string' ? body.redirectUri.trim() : ''

  const nextAppId = incomingAppId || String(stored?.appId || process.env.THREADS_APP_ID || '')
  if (!nextAppId) {
    throw createError({ statusCode: 400, statusMessage: 'Threads App ID is required' })
  }

  const nextAppSecret = incomingAppSecret || String(stored?.appSecret || '')
  if (!nextAppSecret && !String(process.env.THREADS_APP_SECRET || '')) {
    throw createError({ statusCode: 400, statusMessage: 'Threads App Secret is required (provide it here or in THREADS_APP_SECRET)' })
  }

  await setThreadsOAuthAppConfig({
    updatedAt: new Date().toISOString(),
    appId: nextAppId,
    appSecret: nextAppSecret || undefined,
    redirectUri: incomingRedirectUri || stored?.redirectUri || undefined
  })

  const resolved = await resolveThreadsOAuthConfig()

  return {
    success: true,
    data: {
      appId: resolved.appId,
      redirectUri: resolved.redirectUri,
      hasAppSecret: Boolean(resolved.appSecret),
      sources: {
        appId: resolved.appIdSource,
        appSecret: resolved.appSecretSource,
        redirectUri: resolved.redirectUriSource
      }
    }
  }
})