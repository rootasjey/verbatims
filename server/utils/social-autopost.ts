import { db, schema } from 'hub:db'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import type { SocialPlatform } from '#shared/constants/social'
import { isUnimplementedSocialPlatform } from '#shared/constants/social'
import { buildXAuthHeaders, getXAuthConfig, getXCredentialErrorMessage, withXUserContextHint, type XAuthConfig } from './social-x-auth'
import { resolveFacebookPostConfig, resolveInstagramPostConfig, resolveThreadsPostConfig } from './social-meta-config'
import {
  resolveBlueskyProviderConfig,
  resolveFacebookEnabledConfig,
  resolveInstagramEnabledConfig,
  resolvePinterestProviderConfig,
  resolveThreadsEnabledConfig,
  resolveXProviderConfig
} from './social-provider-config'

interface PublishResult {
  ok: boolean
  postId?: string
  postUrl?: string
  error?: string
}

export async function runSocialAutopost() {
  return runSocialAutopostWithOptions({ force: false })
}

export async function runSocialAutopostWithOptions(options: { force?: boolean, platform?: SocialPlatform, baseSiteUrl?: string } = {}) {
  const enabledPlatforms = await getEnabledPlatforms()
  if (!enabledPlatforms.length) {
    return { skipped: true, reason: 'all social posting providers disabled by config' }
  }

  const activePlatforms = options.platform
    ? enabledPlatforms.includes(options.platform)
      ? [options.platform]
      : []
    : enabledPlatforms

  if (!activePlatforms.length) {
    return { skipped: true, reason: `${options.platform} posting disabled by config` }
  }

  const timezone = String(process.env.NUXT_SOCIAL_DAILY_TIMEZONE || 'Europe/Paris')
  const targetTime = String(process.env.NUXT_SOCIAL_DAILY_TIME || '08:08')

  const now = new Date()
  const localTime = getLocalTimeHHMM(now, timezone)
  if (!options.force && localTime !== targetTime) {
    return { skipped: true, reason: `current local time ${localTime} != ${targetTime}` }
  }

  const nextItem = await db.select({
    queueId: schema.socialQueue.id,
    platform: schema.socialQueue.platform,
    quoteId: schema.socialQueue.quoteId,
    quoteText: schema.quotes.name,
    quoteStatus: schema.quotes.status,
    authorName: schema.authors.name,
    referenceName: schema.quoteReferences.name
  })
  .from(schema.socialQueue)
  .leftJoin(schema.quotes, eq(schema.socialQueue.quoteId, schema.quotes.id))
  .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
  .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
  .where(and(...buildQueueConditions(activePlatforms, now)))
  .orderBy(asc(schema.socialQueue.position), asc(schema.socialQueue.id))
  .limit(1)
  .get()

  if (!nextItem) {
    return { skipped: true, reason: 'no queued item available' }
  }

  const claimed = await db.update(schema.socialQueue)
    .set({
      status: 'processing',
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(and(
      eq(schema.socialQueue.id, nextItem.queueId),
      eq(schema.socialQueue.status, 'queued')
    ))
    .returning({ id: schema.socialQueue.id })

  if (!claimed.length) {
    return { skipped: true, reason: 'queue item already claimed' }
  }

  const baseSiteUrl = String(options.baseSiteUrl || process.env.NUXT_PUBLIC_SITE_URL || 'https://verbatims.cc').replace(/\/$/, '')
  const quoteUrl = `${baseSiteUrl}/quotes/${nextItem.quoteId}`

  const quoteText = nextItem.quoteText || ''
  const itemPlatform = nextItem.platform as SocialPlatform
  if (!quoteText || nextItem.quoteStatus !== 'approved') {
    await markQueueAsFailed(nextItem.queueId, nextItem.quoteId, itemPlatform, 'Quote is missing or not approved', quoteUrl)
    return { success: false, queueId: nextItem.queueId, reason: 'quote missing or not approved' }
  }

  const imageUrl = getPlatformImageUrl(itemPlatform, {
    baseSiteUrl,
    quoteId: nextItem.quoteId
  })
  const content = buildPostText(itemPlatform, {
    quoteText,
    authorName: nextItem.authorName || undefined,
    referenceName: nextItem.referenceName || undefined,
    quoteUrl
  })

  const publishResult = await publishByPlatform(itemPlatform, {
    text: content,
    quoteUrl,
    imageUrl
  })

  if (!publishResult.ok) {
    await markQueueAsFailed(nextItem.queueId, nextItem.quoteId, itemPlatform, publishResult.error || 'Unknown social API error', quoteUrl, content)
    return {
      success: false,
      queueId: nextItem.queueId,
      reason: publishResult.error || `${itemPlatform} publish failed`
    }
  }

  await db.insert(schema.socialPosts).values({
    quoteId: nextItem.quoteId,
    queueId: nextItem.queueId,
    platform: itemPlatform as any,
    status: 'success',
    postText: content,
    postUrl: publishResult.postUrl || quoteUrl,
    externalPostId: publishResult.postId,
    idempotencyKey: `${itemPlatform}:${nextItem.queueId}`,
    postedAt: new Date()
  })

  await db.update(schema.socialQueue)
    .set({
      status: 'posted',
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(schema.socialQueue.id, nextItem.queueId))

  return {
    success: true,
    queueId: nextItem.queueId,
    platform: itemPlatform,
    quoteId: nextItem.quoteId,
    postId: publishResult.postId,
    postUrl: publishResult.postUrl
  }
}

function getLocalTimeHHMM(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(now)

  const hour = parts.find(part => part.type === 'hour')?.value || '00'
  const minute = parts.find(part => part.type === 'minute')?.value || '00'

  return `${hour}:${minute}`
}

function buildPostText(platform: SocialPlatform, input: {
  quoteText: string
  authorName?: string
  referenceName?: string
  quoteUrl: string
}): string {
  const attributionParts: string[] = []
  if (input.authorName) attributionParts.push(input.authorName)
  if (input.referenceName) attributionParts.push(input.referenceName)

  const attribution = attributionParts.length ? `— ${attributionParts.join(' · ')}` : ''
  if (platform === 'instagram') {
    const hashtags = buildInstagramHashtags()
    const maxLength = 2200
    const base = [
      `“${input.quoteText.trim()}”`,
      attribution,
      hashtags ? `\n${hashtags}` : ''
    ].filter(Boolean).join('\n').trim()

    if (base.length <= maxLength) return base

    const reserved = [attribution, hashtags ? `\n${hashtags}` : '']
      .filter(Boolean)
      .join('\n').length
    const maxQuoteLength = Math.max(60, maxLength - reserved - 4)
    const truncatedQuote = `${input.quoteText.trim().slice(0, maxQuoteLength)}…`

    return [
      `“${truncatedQuote}”`,
      attribution,
      hashtags ? `\n${hashtags}` : ''
    ].filter(Boolean).join('\n').trim()
  }

  const maxLength = platform === 'x'
    ? 280
    : platform === 'threads'
      ? 500
      : platform === 'facebook'
        ? 5000
        : 300
  const base = `“${input.quoteText.trim()}”\n${attribution}\n${input.quoteUrl}`.trim()

  if (base.length <= maxLength) return base

  const reserved = `\n${attribution}\n${input.quoteUrl}`.length
  const maxQuoteLength = Math.max(30, maxLength - reserved - 4)
  const truncatedQuote = `${input.quoteText.trim().slice(0, maxQuoteLength)}…`

  return `“${truncatedQuote}”\n${attribution}\n${input.quoteUrl}`.trim()
}

function buildQueueConditions(platforms: SocialPlatform[], now: Date) {
  const platformCondition = platforms.length === 1
    ? eq(schema.socialQueue.platform, platforms[0] as any)
    : inArray(schema.socialQueue.platform, platforms as any)

  return [
    platformCondition,
    eq(schema.socialQueue.status, 'queued'),
    sql`(${schema.socialQueue.scheduledFor} IS NULL OR ${schema.socialQueue.scheduledFor} <= ${now})`
  ]
}

async function getEnabledPlatforms(): Promise<SocialPlatform[]> {
  const enabled: SocialPlatform[] = []

  const [resolvedX, resolvedBluesky, resolvedPinterest, resolvedInstagram, resolvedThreads, resolvedFacebook] = await Promise.all([
    resolveXProviderConfig(),
    resolveBlueskyProviderConfig(),
    resolvePinterestProviderConfig(),
    resolveInstagramEnabledConfig(),
    resolveThreadsEnabledConfig(),
    resolveFacebookEnabledConfig()
  ])

  const xEnabled = resolvedX.enabled
  const blueskyEnabled = resolvedBluesky.enabled
  const instagramEnabled = resolvedInstagram.enabled
  const threadsEnabled = resolvedThreads.enabled
  const facebookEnabled = resolvedFacebook.enabled
  const pinterestEnabled = resolvedPinterest.enabled

  if (xEnabled) enabled.push('x')
  if (blueskyEnabled) enabled.push('bluesky')
  if (instagramEnabled) enabled.push('instagram' as SocialPlatform)
  if (threadsEnabled) enabled.push('threads')
  if (facebookEnabled) enabled.push('facebook')
  if (pinterestEnabled) enabled.push('pinterest')

  return enabled
}

async function publishByPlatform(platform: SocialPlatform, payload: { text: string, quoteUrl: string, imageUrl: string }): Promise<PublishResult> {
  if (platform === 'bluesky') {
    return postToBluesky(payload.text, payload.imageUrl)
  }

  if (platform === 'instagram') {
    return postToInstagram(payload.text, payload.imageUrl)
  }

  if (platform === 'threads') {
    return postToThreads(payload.text, payload.imageUrl)
  }

  if (platform === 'facebook') {
    return postToFacebook(payload.text, payload.imageUrl)
  }

  if (platform === 'pinterest') {
    return postToPinterest(payload.text, payload.quoteUrl, payload.imageUrl)
  }

  if (isUnimplementedSocialPlatform(platform)) {
    return { ok: false, error: `${platform} provider is not implemented yet` }
  }

  return postToX(payload.text, payload.imageUrl)
}

async function postToX(text: string, imageUrl: string): Promise<PublishResult> {
  const resolvedX = await resolveXProviderConfig()
  const auth = getXAuthConfig({
    oauth2AccessToken: resolvedX.oauth2AccessToken,
    oauth1ConsumerKey: resolvedX.oauth1ConsumerKey,
    oauth1ConsumerSecret: resolvedX.oauth1ConsumerSecret,
    oauth1AccessToken: resolvedX.oauth1AccessToken,
    oauth1AccessTokenSecret: resolvedX.oauth1AccessTokenSecret
  })
  if (auth.mode === 'none') {
    return { ok: false, error: `${getXCredentialErrorMessage()} (expected KV provider settings or env fallback)` }
  }

  try {
    const requireMedia = resolvedX.requireMedia
    let mediaId: string | undefined

    try {
      mediaId = await uploadXMedia({ auth, imageUrl })
    } catch (error: any) {
      if (requireMedia) {
        return { ok: false, error: error?.message || 'Failed to upload image to X' }
      }
      console.warn('[social-autopost] X media upload failed, falling back to text-only tweet:', error?.message || error)
    }

    const authHeaders = await buildXAuthHeaders({
      method: 'POST',
      url: 'https://api.x.com/2/tweets',
      auth
    })

    const response = await fetch('https://api.x.com/2/tweets', {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mediaId
        ? {
            text,
            media: {
              media_ids: [mediaId]
            }
          }
        : { text })
    })

    const payload = await response.json().catch(() => null) as any

    if (!response.ok) {
      const message = withXUserContextHint(payload?.detail || payload?.title || `X API error (${response.status})`)
      return { ok: false, error: message }
    }

    const postId = payload?.data?.id as string | undefined
    return {
      ok: true,
      postId,
      postUrl: postId ? `https://x.com/i/web/status/${postId}` : undefined
    }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Network error while posting to X' }
  }
}

async function uploadXMedia(input: { auth: XAuthConfig, imageUrl: string }): Promise<string> {
  if (input.auth.mode !== 'oauth1') {
    throw new Error('X media upload requires OAuth 1.0a user context (NUXT_X_POST_OAUTH1_*). Falling back to text-only post.')
  }

  const image = await fetchImagePayload(input.imageUrl)
  const contentType = image.contentType
  const imageBytes = image.bytes
  const form = new FormData()
  form.append('media', new Blob([imageBytes], { type: contentType }), 'quote.png')

  const headers = await buildXAuthHeaders({
    method: 'POST',
    url: 'https://upload.twitter.com/1.1/media/upload.json',
    auth: input.auth
  })

  const response = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
    method: 'POST',
    headers,
    body: form
  })

  const payload = await response.json().catch(() => null) as {
    media_id_string?: string
    errors?: Array<{ message?: string }>
    title?: string
    detail?: string
  } | null

  if (!response.ok || !payload?.media_id_string) {
    const message = withXUserContextHint(payload?.errors?.[0]?.message || payload?.detail || payload?.title || `X media upload error (${response.status})`)
    throw new Error(message)
  }

  return payload.media_id_string
}

function getPlatformImageUrl(platform: SocialPlatform, input: { baseSiteUrl: string, quoteId: number }): string {
  if (platform === 'instagram' || platform === 'threads') {
    return `${input.baseSiteUrl}/api/social/images/quotes/${input.quoteId}.jpg`
  }

  if (platform === 'x' || platform === 'bluesky') {
    return `${input.baseSiteUrl}/api/social/images/quotes/${input.quoteId}.png`
  }

  if (platform === 'facebook') {
    return `${input.baseSiteUrl}/api/social/images/quotes/${input.quoteId}.jpg`
  }

  if (platform === 'pinterest') {
    return `${input.baseSiteUrl}/api/social/images/quotes/${input.quoteId}.jpg`
  }

  return `${input.baseSiteUrl}/api/og/quotes/${input.quoteId}.png`
}

async function postToBluesky(text: string, imageUrl: string): Promise<PublishResult> {
  const resolved = await resolveBlueskyProviderConfig()
  const service = resolved.service
  const identifier = resolved.identifier
  const password = resolved.password

  if (!identifier || !password) {
    return { ok: false, error: 'Missing Bluesky identifier or password (expected KV provider settings or env fallback)' }
  }

  try {
    const sessionResponse = await fetch(`${service}/xrpc/com.atproto.server.createSession`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ identifier, password })
    })

    const sessionPayload = await sessionResponse.json().catch(() => null) as {
      accessJwt?: string
      did?: string
      handle?: string
      message?: string
      error?: string
    } | null

    if (!sessionResponse.ok || !sessionPayload?.accessJwt || !sessionPayload.did || !sessionPayload.handle) {
      const message = sessionPayload?.message || sessionPayload?.error || `Bluesky session error (${sessionResponse.status})`
      return { ok: false, error: message }
    }

    const imagePayload = await fetchImagePayload(imageUrl)
    const imageBytes = imagePayload.bytes
    const uploadResponse = await fetch(`${service}/xrpc/com.atproto.repo.uploadBlob`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionPayload.accessJwt}`,
        'Content-Type': imagePayload.contentType
      },
      body: imageBytes
    })

    const uploadPayload = await uploadResponse.json().catch(() => null) as {
      blob?: {
        $type?: string
        ref?: { $link?: string }
        mimeType?: string
        size?: number
      }
      message?: string
      error?: string
    } | null

    if (!uploadResponse.ok || !uploadPayload?.blob) {
      const message = uploadPayload?.message || uploadPayload?.error || `Bluesky image upload error (${uploadResponse.status})`
      return { ok: false, error: message }
    }

    const record = {
      $type: 'app.bsky.feed.post',
      text,
      createdAt: new Date().toISOString(),
      embed: {
        $type: 'app.bsky.embed.images',
        images: [
          {
            alt: 'Quote image',
            image: uploadPayload.blob
          }
        ]
      }
    }

    const createRecordResponse = await fetch(`${service}/xrpc/com.atproto.repo.createRecord`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionPayload.accessJwt}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        repo: sessionPayload.did,
        collection: 'app.bsky.feed.post',
        record
      })
    })

    const createRecordPayload = await createRecordResponse.json().catch(() => null) as {
      uri?: string
      cid?: string
      message?: string
      error?: string
    } | null

    if (!createRecordResponse.ok || !createRecordPayload?.uri) {
      const message = createRecordPayload?.message || createRecordPayload?.error || `Bluesky post error (${createRecordResponse.status})`
      return { ok: false, error: message }
    }

    const rkey = createRecordPayload.uri.split('/').pop() || ''
    const postUrl = rkey ? `https://bsky.app/profile/${sessionPayload.handle}/post/${rkey}` : undefined

    return {
      ok: true,
      postId: createRecordPayload.uri,
      postUrl
    }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Network error while posting to Bluesky' }
  }
}

async function postToInstagram(caption: string, imageUrl: string): Promise<PublishResult> {
  const baseUrl = String(process.env.NUXT_INSTAGRAM_POST_BASE_URL || 'https://graph.facebook.com').replace(/\/$/, '')
  const apiVersion = String(process.env.NUXT_INSTAGRAM_POST_API_VERSION || 'v24.0').replace(/^\/+/, '')
  const resolvedInstagram = await resolveInstagramPostConfig()
  const accessToken = resolvedInstagram.accessToken
  const igUserId = resolvedInstagram.userId
  const pollIntervalMs = Math.max(1000, Number.parseInt(String(process.env.NUXT_INSTAGRAM_POST_POLL_INTERVAL_MS || '5000'), 10) || 5000)
  const pollTimeoutMs = Math.max(10000, Number.parseInt(String(process.env.NUXT_INSTAGRAM_POST_POLL_TIMEOUT_MS || '300000'), 10) || 300000)

  if (!accessToken) {
    return { ok: false, error: 'Missing Instagram access token (KV Meta OAuth credentials or NUXT_INSTAGRAM_POST_ACCESS_TOKEN)' }
  }

  const resolvedInstagramContext = await resolveInstagramBusinessAccountForPosting({
    baseUrl,
    apiVersion,
    accessToken,
    configuredIgUserId: igUserId
  })

  if (!resolvedInstagramContext.ok) {
    return {
      ok: false,
      error: 'error' in resolvedInstagramContext
        ? resolvedInstagramContext.error
        : 'Unable to resolve Instagram account for posting'
    }
  }

  const targetIgUserId = resolvedInstagramContext.igUserId

  try {
    const createContainerResponse = await fetch(`${baseUrl}/${apiVersion}/${targetIgUserId}/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: imageUrl,
        caption
      })
    })

    const createContainerPayload = await createContainerResponse.json().catch(() => null) as {
      id?: string
      error?: {
        message?: string
        type?: string
        code?: number
      }
    } | null

    if (!createContainerResponse.ok || !createContainerPayload?.id) {
      return { ok: false, error: readGraphApiError(createContainerPayload, `Instagram media container error (${createContainerResponse.status})`) }
    }

    const containerId = createContainerPayload.id
    const readyStatus = await waitForInstagramContainerReady({
      baseUrl,
      apiVersion,
      accessToken,
      containerId,
      pollIntervalMs,
      pollTimeoutMs
    })

    if (!readyStatus.ok) {
      return { ok: false, error: readyStatus.error }
    }

    const publishResponse = await fetch(`${baseUrl}/${apiVersion}/${targetIgUserId}/media_publish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creation_id: containerId
      })
    })

    const publishPayload = await publishResponse.json().catch(() => null) as {
      id?: string
      error?: {
        message?: string
        type?: string
        code?: number
      }
    } | null

    if (!publishResponse.ok || !publishPayload?.id) {
      return { ok: false, error: readGraphApiError(publishPayload, `Instagram publish error (${publishResponse.status})`) }
    }

    const mediaId = publishPayload.id
    const postUrl = await getInstagramPermalink({
      baseUrl,
      apiVersion,
      accessToken,
      mediaId
    })

    return {
      ok: true,
      postId: mediaId,
      postUrl: postUrl || undefined
    }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Network error while posting to Instagram' }
  }
}

async function resolveInstagramBusinessAccountForPosting(input: {
  baseUrl: string
  apiVersion: string
  accessToken: string
  configuredIgUserId: string
}): Promise<{ ok: true, igUserId: string } | { ok: false, error: string }> {
  const candidateIds = [input.configuredIgUserId].filter(Boolean)

  try {
    const discoveryResponse = await fetch(`${input.baseUrl}/${input.apiVersion}/me/accounts?fields=id,name,instagram_business_account{id,username}&limit=50`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${input.accessToken}`
      }
    })

    const discoveryPayload = await discoveryResponse.json().catch(() => null) as {
      data?: Array<{
        instagram_business_account?: {
          id?: string
          username?: string
        }
      }>
      error?: { message?: string }
    } | null

    if (discoveryResponse.ok) {
      const discoveredId = discoveryPayload?.data?.find(page => page?.instagram_business_account?.id)?.instagram_business_account?.id || ''
      if (discoveredId && !candidateIds.includes(discoveredId)) {
        candidateIds.push(discoveredId)
      }
    }
  } catch {
  }

  if (!candidateIds.length) {
    return { ok: false, error: 'Missing NUXT_INSTAGRAM_POST_IG_USER_ID and could not discover an accessible Instagram business account from the current token' }
  }

  for (const candidateId of candidateIds) {
    try {
      const checkResponse = await fetch(`${input.baseUrl}/${input.apiVersion}/${candidateId}?fields=id,username`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${input.accessToken}`
        }
      })

      if (checkResponse.ok) {
        return { ok: true, igUserId: candidateId }
      }
    } catch {
    }
  }

  return { ok: false, error: 'Instagram account is not accessible with the current token. Verify instagram_basic / instagram_content_publish permissions and update NUXT_INSTAGRAM_POST_IG_USER_ID to a reachable account.' }
}

async function postToThreads(text: string, imageUrl: string): Promise<PublishResult> {
  const baseUrl = String(process.env.NUXT_THREADS_POST_BASE_URL || 'https://graph.threads.net').replace(/\/$/, '')
  const apiVersion = String(process.env.NUXT_THREADS_POST_API_VERSION || 'v1.0').replace(/^\/+/, '')
  const resolvedThreads = await resolveThreadsPostConfig()
  const accessToken = resolvedThreads.accessToken
  const userId = resolvedThreads.userId
  const pollIntervalMs = Math.max(1000, Number.parseInt(String(process.env.NUXT_THREADS_POST_POLL_INTERVAL_MS || '4000'), 10) || 4000)
  const pollTimeoutMs = Math.max(10000, Number.parseInt(String(process.env.NUXT_THREADS_POST_POLL_TIMEOUT_MS || '120000'), 10) || 120000)

  if (!accessToken || !userId) {
    return { ok: false, error: 'Missing Threads access token/user id (KV Meta OAuth credentials or NUXT_THREADS_POST_ACCESS_TOKEN + NUXT_THREADS_POST_USER_ID)' }
  }

  try {
    const createContainerResponse = await fetch(`${baseUrl}/${apiVersion}/${userId}/threads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        media_type: 'IMAGE',
        image_url: imageUrl,
        text
      })
    })

    const createContainerPayload = await createContainerResponse.json().catch(() => null) as {
      id?: string
      error?: {
        message?: string
        type?: string
        code?: number
      }
    } | null

    if (!createContainerResponse.ok || !createContainerPayload?.id) {
      return { ok: false, error: readGraphApiError(createContainerPayload, `Threads container creation error (${createContainerResponse.status})`) }
    }

    const containerId = createContainerPayload.id
    const readyStatus = await waitForThreadsContainerReady({
      baseUrl,
      apiVersion,
      accessToken,
      containerId,
      pollIntervalMs,
      pollTimeoutMs
    })

    if (!readyStatus.ok) {
      return { ok: false, error: readyStatus.error }
    }

    const publishResponse = await fetch(`${baseUrl}/${apiVersion}/${userId}/threads_publish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creation_id: containerId
      })
    })

    const publishPayload = await publishResponse.json().catch(() => null) as {
      id?: string
      error?: {
        message?: string
        type?: string
        code?: number
      }
    } | null

    if (!publishResponse.ok || !publishPayload?.id) {
      return { ok: false, error: readGraphApiError(publishPayload, `Threads publish error (${publishResponse.status})`) }
    }

    const mediaId = publishPayload.id
    const postUrl = await getThreadsPermalink({
      baseUrl,
      apiVersion,
      accessToken,
      mediaId
    })

    return {
      ok: true,
      postId: mediaId,
      postUrl: postUrl || undefined
    }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Network error while posting to Threads' }
  }
}

async function postToFacebook(message: string, imageUrl: string): Promise<PublishResult> {
  const baseUrl = String(process.env.NUXT_FACEBOOK_POST_BASE_URL || 'https://graph.facebook.com').replace(/\/$/, '')
  const apiVersion = String(process.env.NUXT_FACEBOOK_POST_API_VERSION || 'v24.0').replace(/^\/+/, '')
  const resolvedFacebook = await resolveFacebookPostConfig()
  const accessToken = resolvedFacebook.pageAccessToken
  const pageId = resolvedFacebook.pageId

  if (!accessToken || !pageId) {
    return { ok: false, error: 'Missing Facebook page token/page id (KV Meta OAuth credentials or NUXT_FACEBOOK_POST_ACCESS_TOKEN + NUXT_FACEBOOK_POST_PAGE_ID)' }
  }

  try {
    const response = await fetch(`${baseUrl}/${apiVersion}/${pageId}/photos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: imageUrl,
        message,
        published: true
      })
    })

    const payload = await response.json().catch(() => null) as {
      id?: string
      post_id?: string
      error?: {
        message?: string
        type?: string
        code?: number
      }
    } | null

    if (!response.ok || (!payload?.id && !payload?.post_id)) {
      return { ok: false, error: readGraphApiError(payload, `Facebook publish error (${response.status})`) }
    }

    const postId = payload?.post_id || payload?.id
    return {
      ok: true,
      postId,
      postUrl: postId ? `https://www.facebook.com/${postId}` : undefined
    }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Network error while posting to Facebook' }
  }
}

async function postToPinterest(description: string, quoteUrl: string, imageUrl: string): Promise<PublishResult> {
  const config = await resolvePinterestProviderConfig()
  const baseUrl = config.baseUrl
  const apiVersion = config.apiVersion
  const accessToken = config.accessToken
  const boardId = config.boardId

  if (!accessToken || !boardId) {
    return { ok: false, error: 'Missing Pinterest access token or board id (expected KV provider settings or env fallback)' }
  }

  try {
    const response = await fetch(`${baseUrl}/${apiVersion}/pins`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        board_id: boardId,
        title: truncatePinterestTitle(description),
        description,
        link: quoteUrl,
        media_source: {
          source_type: 'image_url',
          url: imageUrl
        }
      })
    })

    const payload = await response.json().catch(() => null) as {
      id?: string
      board_id?: string
      title?: string
      error?: {
        message?: string
      }
      message?: string
      code?: number
    } | null

    if (!response.ok || !payload?.id) {
      return { ok: false, error: readPinterestApiError(payload, `Pinterest publish error (${response.status})`, baseUrl) }
    }

    return {
      ok: true,
      postId: payload.id,
      postUrl: `https://www.pinterest.com/pin/${payload.id}`
    }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Network error while posting to Pinterest' }
  }
}

async function waitForThreadsContainerReady(input: {
  baseUrl: string
  apiVersion: string
  accessToken: string
  containerId: string
  pollIntervalMs: number
  pollTimeoutMs: number
}): Promise<{ ok: boolean, error?: string }> {
  const startedAt = Date.now()

  while ((Date.now() - startedAt) < input.pollTimeoutMs) {
    const statusResponse = await fetch(`${input.baseUrl}/${input.apiVersion}/${input.containerId}?fields=status,error_message`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${input.accessToken}`
      }
    })

    const statusPayload = await statusResponse.json().catch(() => null) as {
      status?: string
      error_message?: string
      error?: {
        message?: string
        type?: string
        code?: number
      }
    } | null

    if (!statusResponse.ok) {
      return { ok: false, error: readGraphApiError(statusPayload, `Threads container status error (${statusResponse.status})`) }
    }

    const status = String(statusPayload?.status || '').toUpperCase()
    if (status === 'FINISHED' || status === 'PUBLISHED') {
      return { ok: true }
    }

    if (status === 'ERROR' || status === 'EXPIRED') {
      return { ok: false, error: statusPayload?.error_message || `Threads container is ${status.toLowerCase()}` }
    }

    await delay(input.pollIntervalMs)
  }

  return { ok: false, error: 'Timed out while waiting for Threads container processing' }
}

async function getThreadsPermalink(input: {
  baseUrl: string
  apiVersion: string
  accessToken: string
  mediaId: string
}): Promise<string | null> {
  const response = await fetch(`${input.baseUrl}/${input.apiVersion}/${input.mediaId}?fields=permalink`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.accessToken}`
    }
  })

  const payload = await response.json().catch(() => null) as {
    permalink?: string
  } | null

  if (!response.ok || !payload?.permalink) {
    return null
  }

  return payload.permalink
}

async function waitForInstagramContainerReady(input: {
  baseUrl: string
  apiVersion: string
  accessToken: string
  containerId: string
  pollIntervalMs: number
  pollTimeoutMs: number
}): Promise<{ ok: boolean, error?: string }> {
  const startedAt = Date.now()

  while ((Date.now() - startedAt) < input.pollTimeoutMs) {
    const statusResponse = await fetch(`${input.baseUrl}/${input.apiVersion}/${input.containerId}?fields=status_code`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${input.accessToken}`
      }
    })

    const statusPayload = await statusResponse.json().catch(() => null) as {
      status_code?: string
      error?: {
        message?: string
        type?: string
        code?: number
      }
    } | null

    if (!statusResponse.ok) {
      return { ok: false, error: readGraphApiError(statusPayload, `Instagram container status error (${statusResponse.status})`) }
    }

    const status = String(statusPayload?.status_code || '')
    if (status === 'FINISHED' || status === 'PUBLISHED') {
      return { ok: true }
    }

    if (status === 'ERROR' || status === 'EXPIRED') {
      return { ok: false, error: `Instagram container is ${status.toLowerCase()}` }
    }

    await delay(input.pollIntervalMs)
  }

  return { ok: false, error: 'Timed out while waiting for Instagram media container processing' }
}

async function getInstagramPermalink(input: {
  baseUrl: string
  apiVersion: string
  accessToken: string
  mediaId: string
}): Promise<string | null> {
  const response = await fetch(`${input.baseUrl}/${input.apiVersion}/${input.mediaId}?fields=permalink`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.accessToken}`
    }
  })

  const payload = await response.json().catch(() => null) as {
    permalink?: string
  } | null

  if (!response.ok || !payload?.permalink) {
    return null
  }

  return payload.permalink
}

function buildInstagramHashtags(): string {
  const source = String(process.env.NUXT_INSTAGRAM_POST_HASHTAGS || '#quotes #inspiration #verbatims').trim()
  if (!source) return ''

  const normalized = source
    .split(/[\s,]+/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => part.startsWith('#') ? part : `#${part}`)
    .map(part => `#${part.slice(1).replace(/[^\p{L}\p{N}_]/gu, '')}`)
    .filter(part => part.length > 1)

  const unique = [...new Set(normalized)].slice(0, 30)
  return unique.join(' ')
}

function readGraphApiError(payload: any, fallback: string): string {
  return payload?.error?.message || payload?.message || fallback
}

function readPinterestApiError(payload: any, fallback: string, baseUrl: string): string {
  const message = payload?.message || payload?.error?.message || fallback
  const isAuthFailed = typeof message === 'string' && message.toLowerCase().includes('authentication failed')
  const usingProdHost = baseUrl.includes('api.pinterest.com') && !baseUrl.includes('api-sandbox.pinterest.com')

  if (isAuthFailed && usingProdHost) {
    return `${message} If you are using a Sandbox token, set Pinterest base URL to https://api-sandbox.pinterest.com.`
  }

  return message
}

function truncatePinterestTitle(text: string): string {
  const normalized = text
    .replace(/\s+/g, ' ')
    .trim()

  if (normalized.length <= 100) {
    return normalized
  }

  return `${normalized.slice(0, 99)}…`
}

async function delay(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchImagePayload(imageUrl: string): Promise<{ bytes: ArrayBuffer, contentType: string }> {
  const internalPath = getInternalImagePath(imageUrl)

  if (internalPath) {
    try {
      const response = await $fetch.raw<ArrayBuffer>(internalPath, {
        responseType: 'arrayBuffer'
      })

      return {
        bytes: toArrayBuffer(response._data),
        contentType: response.headers.get('content-type') || 'image/png'
      }
    } catch {
      // Fallback to external fetch below
    }
  }

  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image from ${imageUrl}`)
  }

  return {
    bytes: await imageResponse.arrayBuffer(),
    contentType: imageResponse.headers.get('content-type') || 'image/png'
  }
}

function getInternalImagePath(imageUrl: string): string | null {
  try {
    const parsed = new URL(imageUrl)
    const pathname = parsed.pathname || ''
    const isKnownImageEndpoint = pathname.startsWith('/api/social/images/') || pathname.startsWith('/api/og/')
    if (!isKnownImageEndpoint) return null
    return `${pathname}${parsed.search || ''}`
  } catch {
    return null
  }
}

function toArrayBuffer(data: unknown): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data
  if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView
    const result = new ArrayBuffer(view.byteLength)
    new Uint8Array(result).set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength))
    return result
  }
  throw new Error('Invalid image payload returned by internal fetch')
}

async function markQueueAsFailed(
  queueId: number,
  quoteId: number,
  platform: SocialPlatform,
  errorMessage: string,
  quoteUrl: string,
  postText: string = ''
) {
  await db.insert(schema.socialPosts).values({
    quoteId,
    queueId,
    platform: platform as any,
    status: 'failed',
    postText: postText || quoteUrl,
    postUrl: quoteUrl,
    errorMessage,
    idempotencyKey: `${platform}:${queueId}`,
    postedAt: new Date()
  }).onConflictDoNothing()

  await db.update(schema.socialQueue)
    .set({
      status: 'failed',
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(schema.socialQueue.id, queueId))
}
