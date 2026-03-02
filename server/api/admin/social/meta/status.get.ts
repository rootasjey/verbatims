import { getMetaSocialCredentials } from '../../../../utils/social-meta-config'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const stored = await getMetaSocialCredentials()

  const envInstagramToken = String(process.env.NUXT_INSTAGRAM_POST_ACCESS_TOKEN || '')
  const envInstagramUserId = String(process.env.NUXT_INSTAGRAM_POST_IG_USER_ID || '')
  const envThreadsToken = String(process.env.NUXT_THREADS_POST_ACCESS_TOKEN || '')
  const envThreadsUserId = String(process.env.NUXT_THREADS_POST_USER_ID || '')
  const envFacebookToken = String(process.env.NUXT_FACEBOOK_POST_ACCESS_TOKEN || '')
  const envFacebookPageId = String(process.env.NUXT_FACEBOOK_POST_PAGE_ID || '')

  const instagramKvConnected = Boolean(stored?.instagram?.accessToken && stored?.instagram?.userId)
  const threadsKvConnected = Boolean(stored?.threads?.accessToken && stored?.threads?.userId)
  const facebookKvConnected = Boolean(stored?.facebook?.pageAccessToken && stored?.facebook?.pageId)

  const instagramEnvConnected = Boolean(envInstagramToken && envInstagramUserId)
  const threadsEnvConnected = Boolean(envThreadsToken && envThreadsUserId)
  const facebookEnvConnected = Boolean(envFacebookToken && envFacebookPageId)

  return {
    success: true,
    data: {
      updatedAt: stored?.updatedAt || null,
      instagram: {
        connected: instagramKvConnected || instagramEnvConnected,
        source: instagramKvConnected ? 'kv' : instagramEnvConnected ? 'env' : 'none',
        userId: stored?.instagram?.userId || envInstagramUserId || '',
        username: stored?.instagram?.username || '',
        expiresAt: stored?.instagram?.expiresAt || null
      },
      threads: {
        connected: threadsKvConnected || threadsEnvConnected,
        source: threadsKvConnected ? 'kv' : threadsEnvConnected ? 'env' : 'none',
        userId: stored?.threads?.userId || envThreadsUserId || '',
        username: stored?.threads?.username || '',
        expiresAt: stored?.threads?.expiresAt || null
      },
      facebook: {
        connected: facebookKvConnected || facebookEnvConnected,
        source: facebookKvConnected ? 'kv' : facebookEnvConnected ? 'env' : 'none',
        pageId: stored?.facebook?.pageId || envFacebookPageId || '',
        pageName: stored?.facebook?.pageName || '',
        perms: stored?.facebook?.perms || []
      }
    }
  }
})
