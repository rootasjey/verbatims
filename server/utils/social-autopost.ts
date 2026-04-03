import { db, schema } from 'hub:db'
import { and, asc, eq, inArray, isNull, lte, or, sql } from 'drizzle-orm'
import type { SocialPlatform } from '#shared/constants/social'
import { isUnimplementedSocialPlatform } from '#shared/constants/social'
import {
  buildSocialPostText,
  runSocialAutopostQueue,
  type SocialAutopostBatchResult,
  type SocialAutopostExecutionResult,
  type SocialAutopostQueueLoader,
  type SocialAutopostQueueProcessor,
  getAutopostMaxDurationMs,
  normalizeHashtagString,
  type SocialAutopostRunOptions,
} from '@verbatims/social-autopost-core'
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
import { getVerbatimsFallbackCanonicalUrl, verbatimsSocialPublishableSourceResolver } from './social-autopost-verbatims'

interface PublishResult {
  ok: boolean
  postId?: string
  postUrl?: string
  error?: string
}

interface QueueCandidate {
  queueId: number
  platform: SocialPlatform
  sourceType: string
  sourceId: number
  quoteId: number
}

interface SocialAutopostSuccessResult {
  success: true
  queueId: number
  platform: SocialPlatform
  quoteId: number
  postId?: string
  postUrl?: string
}

interface SocialAutopostFailureResult {
  success: false
  queueId: number
  platform: SocialPlatform
  quoteId: number
  reason: string
}

type SocialAutopostProcessedResult = SocialAutopostSuccessResult | SocialAutopostFailureResult
type SocialAutopostPlatformResult = SocialAutopostExecutionResult<SocialPlatform, SocialAutopostProcessedResult>
type SocialAutopostSingleResult = SocialAutopostPlatformResult

type BlueskyFacet = {
  index: {
    byteStart: number
    byteEnd: number
  }
  features: Array<
    { $type: 'app.bsky.richtext.facet#link', uri: string }
    | { $type: 'app.bsky.richtext.facet#tag', tag: string }
  >
}

const utf8Encoder = new TextEncoder()

export async function runSocialAutopost() {
  return runSocialAutopostWithOptions({ force: false })
}

export async function runSocialAutopostWithOptions(options: SocialAutopostRunOptions = {}): Promise<SocialAutopostSingleResult | SocialAutopostBatchResult<SocialAutopostPlatformResult>> {
  const enabledPlatforms = await getEnabledPlatforms()
  const timezone = String(process.env.NUXT_SOCIAL_DAILY_TIMEZONE || 'Europe/Paris')
  const targetTime = String(process.env.NUXT_SOCIAL_DAILY_TIME || '08:08')
  const baseSiteUrl = String(options.baseSiteUrl || process.env.NUXT_PUBLIC_SITE_URL || 'https://verbatims.cc').replace(/\/$/, '')
  const maxDurationMs = getAutopostMaxDurationMs(process.env.NUXT_SOCIAL_AUTOPOST_MAX_DURATION_MS)
  return runSocialAutopostQueue({
    enabledPlatforms,
    options,
    timezone,
    targetTime,
    baseSiteUrl,
    maxDurationMs,
    getNextQueuedItem,
    processQueueCandidate
  })
}

const getNextQueuedItem: SocialAutopostQueueLoader<SocialPlatform, QueueCandidate> = async (platform, now) => {
  return db.select({
    queueId: schema.socialQueue.id,
    platform: schema.socialQueue.platform,
    sourceType: schema.socialQueue.sourceType,
    sourceId: schema.socialQueue.sourceId,
    quoteId: schema.socialQueue.quoteId
  })
  .from(schema.socialQueue)
  .where(and(...buildQueueConditions([platform], now)))
  .orderBy(asc(schema.socialQueue.position), asc(schema.socialQueue.id))
  .limit(1)
  .get()
}

const processQueueCandidate: SocialAutopostQueueProcessor<SocialPlatform, QueueCandidate, SocialAutopostProcessedResult> = async (nextItem, context) => {
  const baseSiteUrl = context.baseSiteUrl
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
    return { skipped: true, platform: nextItem.platform, reason: 'queue item already claimed' }
  }

  const itemPlatform = nextItem.platform as SocialPlatform
  const resolvedContent = await verbatimsSocialPublishableSourceResolver.resolveSource({
    sourceType: nextItem.sourceType,
    sourceId: nextItem.sourceId,
    baseSiteUrl,
    platform: itemPlatform
  })

  if (!resolvedContent) {
    const canonicalUrl = getVerbatimsFallbackCanonicalUrl({
      sourceType: nextItem.sourceType,
      sourceId: nextItem.sourceId,
      quoteId: nextItem.quoteId,
      baseSiteUrl
    })
    await markQueueAsFailed(nextItem.queueId, nextItem.quoteId, nextItem.sourceType, nextItem.sourceId, itemPlatform, 'Quote is missing or not approved', canonicalUrl)
    return { success: false, queueId: nextItem.queueId, platform: itemPlatform, quoteId: nextItem.quoteId, reason: 'quote missing or not approved' }
  }

  const resolvedBluesky = itemPlatform === 'bluesky'
    ? await resolveBlueskyProviderConfig()
    : null
  const blueskyHashtags = itemPlatform === 'bluesky'
    ? buildBlueskyHashtags(resolvedContent.content.hashtags, resolvedBluesky?.hashtags)
    : undefined
  const instagramHashtags = itemPlatform === 'instagram'
    ? buildInstagramHashtags(resolvedContent.content.hashtags)
    : undefined

  const content = buildSocialPostText(itemPlatform, resolvedContent.content, {
    blueskyHashtags,
    instagramHashtags
  })
  const canonicalUrl = resolvedContent.content.canonicalUrl || `${baseSiteUrl}/quotes/${nextItem.quoteId}`

  const publishResult = await publishByPlatform(itemPlatform, {
    text: content,
    canonicalUrl,
    imageUrl: resolvedContent.media.url,
    blueskyHashtags
  })

  if (!publishResult.ok) {
    await markQueueAsFailed(nextItem.queueId, nextItem.quoteId, resolvedContent.content.sourceType, Number(resolvedContent.content.sourceId), itemPlatform, publishResult.error || 'Unknown social API error', canonicalUrl, content)
    return {
      success: false,
      queueId: nextItem.queueId,
      platform: itemPlatform,
      quoteId: nextItem.quoteId,
      reason: publishResult.error || `${itemPlatform} publish failed`
    }
  }

  await db.insert(schema.socialPosts).values({
    quoteId: nextItem.quoteId,
    sourceType: resolvedContent.content.sourceType,
    sourceId: Number(resolvedContent.content.sourceId),
    queueId: nextItem.queueId,
    platform: itemPlatform as any,
    status: 'success',
    postText: content,
    postUrl: publishResult.postUrl || canonicalUrl,
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

function buildQueueConditions(platforms: SocialPlatform[], now: Date) {
  const platformCondition = platforms.length === 1
    ? eq(schema.socialQueue.platform, platforms[0] as any)
    : inArray(schema.socialQueue.platform, platforms as any)

  return [
    platformCondition,
    eq(schema.socialQueue.status, 'queued'),
    or(
      isNull(schema.socialQueue.scheduledFor),
      lte(schema.socialQueue.scheduledFor, now)
    )
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

async function publishByPlatform(platform: SocialPlatform, payload: { text: string, canonicalUrl: string, imageUrl: string, blueskyHashtags?: string }): Promise<PublishResult> {
  if (platform === 'bluesky') {
    return postToBluesky(payload.text, payload.canonicalUrl, payload.imageUrl, payload.blueskyHashtags)
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
    return postToPinterest(payload.text, payload.canonicalUrl, payload.imageUrl)
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

async function postToBluesky(text: string, canonicalUrl: string, imageUrl: string, hashtagsSource?: string): Promise<PublishResult> {
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

    const facets = buildBlueskyFacets(text, canonicalUrl, hashtagsSource)
    const record = {
      $type: 'app.bsky.feed.post',
      text,
      createdAt: new Date().toISOString(),
      ...(facets ? { facets } : {}),
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

function buildBlueskyFacets(text: string, canonicalUrl: string, hashtagsSource?: string): BlueskyFacet[] | undefined {
  const facets: BlueskyFacet[] = []
  const hashtags = buildBlueskyHashtags([], hashtagsSource)
    .split(/\s+/)
    .map(part => part.trim())
    .filter(Boolean)

  const linkStart = text.lastIndexOf(canonicalUrl)
  if (linkStart !== -1) {
    facets.push({
      index: buildBlueskyFacetIndex(text, linkStart, linkStart + canonicalUrl.length),
      features: [
        {
          $type: 'app.bsky.richtext.facet#link',
          uri: canonicalUrl
        }
      ]
    })
  }

  let searchFrom = linkStart === -1 ? 0 : linkStart + canonicalUrl.length
  for (const hashtag of hashtags) {
    const hashtagStart = text.indexOf(hashtag, searchFrom)
    if (hashtagStart === -1) continue

    facets.push({
      index: buildBlueskyFacetIndex(text, hashtagStart, hashtagStart + hashtag.length),
      features: [
        {
          $type: 'app.bsky.richtext.facet#tag',
          tag: hashtag.slice(1)
        }
      ]
    })
    searchFrom = hashtagStart + hashtag.length
  }

  return facets.length ? facets : undefined
}

function buildBlueskyFacetIndex(text: string, start: number, end: number) {
  return {
    byteStart: utf16IndexToUtf8Index(text, start),
    byteEnd: utf16IndexToUtf8Index(text, end)
  }
}

function utf16IndexToUtf8Index(text: string, index: number): number {
  return utf8Encoder.encode(text.slice(0, index)).byteLength
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
    await ensureRemoteImageReady(imageUrl, 'Instagram')

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
    await ensureRemoteImageReady(imageUrl, 'Threads')

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
  const apiVersion = String(process.env.NUXT_FACEBOOK_POST_API_VERSION || 'v25.0').replace(/^\/+/, '')
  const resolvedFacebook = await resolveFacebookPostConfig()
  const accessToken = resolvedFacebook.pageAccessToken
  const pageId = resolvedFacebook.pageId

  if (!accessToken || !pageId) {
    return { ok: false, error: 'Missing Facebook page token/page id (KV Meta OAuth credentials or NUXT_FACEBOOK_POST_ACCESS_TOKEN + NUXT_FACEBOOK_POST_PAGE_ID)' }
  }

  try {
    await ensureRemoteImageReady(imageUrl, 'Facebook')

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

async function postToPinterest(description: string, canonicalUrl: string, imageUrl: string): Promise<PublishResult> {
  const config = await resolvePinterestProviderConfig()
  const baseUrl = config.baseUrl
  const apiVersion = config.apiVersion
  const accessToken = config.accessToken
  const boardId = config.boardId

  if (!accessToken || !boardId) {
    return { ok: false, error: 'Missing Pinterest access token or board id (expected KV provider settings or env fallback)' }
  }

  try {
    await ensureRemoteImageReady(imageUrl, 'Pinterest')

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
        link: canonicalUrl,
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

function buildInstagramHashtags(contentHashtags: string[] = []): string {
  const source = String(process.env.NUXT_INSTAGRAM_POST_HASHTAGS || '#quotes #inspiration #verbatims').trim()
  return normalizeHashtagString(`${contentHashtags.join(' ')} ${source}`.trim(), 30)
}

function buildBlueskyHashtags(contentHashtags: string[] = [], sourceValue?: string): string {
  const source = String(sourceValue ?? process.env.NUXT_BLUESKY_POST_HASHTAGS ?? '').trim()
  return normalizeHashtagString(`${contentHashtags.join(' ')} ${source}`.trim(), 3)
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
    const details = await imageResponse.text().catch(() => '')
    const suffix = details ? ` (${imageResponse.status}: ${details.slice(0, 240)})` : ` (${imageResponse.status})`
    throw new Error(`Failed to fetch image from ${imageUrl}${suffix}`)
  }

  return {
    bytes: await imageResponse.arrayBuffer(),
    contentType: imageResponse.headers.get('content-type') || 'image/png'
  }
}

async function ensureRemoteImageReady(imageUrl: string, platformLabel: string): Promise<void> {
  const { contentType } = await fetchImagePayload(imageUrl)
  const normalizedContentType = contentType.split(';')[0]?.trim().toLowerCase() || ''

  if (!normalizedContentType.startsWith('image/')) {
    throw new Error(`${platformLabel} media URL did not return an image (${normalizedContentType || 'unknown content type'})`)
  }
}

function getInternalImagePath(imageUrl: string): string | null {
  try {
    const runtimeConfig = useRuntimeConfig()
    const parsed = new URL(imageUrl)
    const normalizedOrigin = parsed.origin.replace(/\/$/, '')
    const knownOrigins = new Set(
      [
        String(runtimeConfig.public.siteUrl || ''),
        String(runtimeConfig.public.authUrl || '')
      ]
        .map(value => value.trim().replace(/\/$/, ''))
        .filter(Boolean)
    )
    const hostname = parsed.hostname.toLowerCase()
    const isLocalHost = hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname === '::1'
      || hostname.endsWith('.local')
    const isKnownOrigin = knownOrigins.has(normalizedOrigin)
    if (!isLocalHost && !isKnownOrigin) return null
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
  sourceType: string,
  sourceId: number,
  platform: SocialPlatform,
  errorMessage: string,
  canonicalUrl: string,
  postText: string = ''
) {
  await db.insert(schema.socialPosts).values({
    quoteId,
    sourceType,
    sourceId,
    queueId,
    platform: platform as any,
    status: 'failed',
    postText: postText || canonicalUrl,
    postUrl: canonicalUrl,
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
