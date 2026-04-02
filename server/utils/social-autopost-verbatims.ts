import { db, schema } from 'hub:db'
import { and, eq, inArray, like, or } from 'drizzle-orm'
import type {
  SocialAutopostPlatform,
  SocialContentPayload,
  SocialMediaAsset,
  SocialPublishableSourceResolver,
  SocialResolvedPublishableSource,
  SocialSourceDisplay,
  SocialSourceDisplayResolver,
  SocialSourceRef,
  SocialSourceSearchResolver
} from '@verbatims/social-autopost-core'
import { getSocialSourceKey } from '@verbatims/social-autopost-core'

export interface VerbatimsQuoteQueueCandidate {
  quoteId: number
  quoteText: string | null
  quoteStatus: string | null
  authorName: string | null
  referenceName: string | null
}

export interface VerbatimsQueueSourceRef {
  sourceType: string
  sourceId: number
  quoteId: number
}

export interface VerbatimsResolvedQuoteContent {
  content: SocialContentPayload
  media: SocialMediaAsset
}

export interface VerbatimsResolvedSourceDisplay extends SocialSourceDisplay {
  quoteId: number | null
  quoteText: string | null
  quoteLanguage: string | null
  authorName: string | null
  referenceName: string | null
  canonicalPath: string | null
  title: string | null
  subtitle: string | null
  primaryText: string | null
  secondaryText: string | null
  language: string | null
}

export const verbatimsSocialSourceSearchResolver: SocialSourceSearchResolver = {
  async searchSources(search: string): Promise<SocialSourceRef[]> {
  const normalizedSearch = search.trim()
  if (!normalizedSearch) {
    return []
  }

  const matches = await db.select({
    sourceType: schema.socialQueue.sourceType,
    sourceId: schema.socialQueue.sourceId
  })
    .from(schema.socialQueue)
    .leftJoin(schema.quotes, eq(schema.socialQueue.quoteId, schema.quotes.id))
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .where(and(
      eq(schema.socialQueue.sourceType, 'quote'),
      or(
        like(schema.quotes.name, `%${normalizedSearch}%`),
        like(schema.authors.name, `%${normalizedSearch}%`),
        like(schema.quoteReferences.name, `%${normalizedSearch}%`)
      )
    ))
    .groupBy(schema.socialQueue.sourceType, schema.socialQueue.sourceId)

  return matches.map(match => ({
    sourceType: match.sourceType,
    sourceId: match.sourceId
  }))
  }
}

export async function findVerbatimsSocialSourcesBySearch(search: string): Promise<SocialSourceRef[]> {
  return verbatimsSocialSourceSearchResolver.searchSources(search)
}

export const verbatimsSocialSourceDisplayResolver: SocialSourceDisplayResolver = {
  async resolveDisplays(sources: SocialSourceRef[]): Promise<Record<string, VerbatimsResolvedSourceDisplay>> {
  const uniqueSources = Array.from(new Map(
    sources.map(source => [getSocialSourceKey(source), source])
  ).values())

  const resolved: Record<string, VerbatimsResolvedSourceDisplay> = {}
  const quoteSourceIds = uniqueSources
    .filter(source => source.sourceType === 'quote')
    .map(source => Number(source.sourceId))
    .filter(sourceId => Number.isFinite(sourceId))

  if (quoteSourceIds.length) {
    const quotes = await db.select({
      quoteId: schema.quotes.id,
      quoteText: schema.quotes.name,
      quoteLanguage: schema.quotes.language,
      authorName: schema.authors.name,
      referenceName: schema.quoteReferences.name
    })
      .from(schema.quotes)
      .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
      .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
      .where(inArray(schema.quotes.id, quoteSourceIds))

    for (const quote of quotes) {
      const secondaryText = [quote.authorName, quote.referenceName].filter(Boolean).join(' · ')
      const key = getSocialSourceKey({ sourceType: 'quote', sourceId: quote.quoteId })
      resolved[key] = {
        sourceType: 'quote',
        sourceId: quote.quoteId,
        quoteId: quote.quoteId,
        quoteText: quote.quoteText,
        quoteLanguage: quote.quoteLanguage,
        authorName: quote.authorName,
        referenceName: quote.referenceName,
        canonicalPath: `/quotes/${quote.quoteId}`,
        title: quote.authorName,
        subtitle: quote.referenceName,
        primaryText: quote.quoteText,
        secondaryText: secondaryText || null,
        language: quote.quoteLanguage,
        metadata: {
          quoteId: quote.quoteId,
          quoteText: quote.quoteText,
          quoteLanguage: quote.quoteLanguage,
          authorName: quote.authorName,
          referenceName: quote.referenceName
        }
      }
    }
  }

  for (const source of uniqueSources) {
    const key = getSocialSourceKey(source)
    if (!resolved[key]) {
      resolved[key] = {
        sourceType: source.sourceType,
        sourceId: Number(source.sourceId),
        quoteId: null,
        quoteText: null,
        quoteLanguage: null,
        authorName: null,
        referenceName: null,
        canonicalPath: null,
        title: null,
        subtitle: null,
        primaryText: null,
        secondaryText: null,
        language: null,
        metadata: {}
      }
    }
  }

  return resolved
  }
}

export async function resolveVerbatimsSourceDisplays(sources: SocialSourceRef[]): Promise<Record<string, VerbatimsResolvedSourceDisplay>> {
  return verbatimsSocialSourceDisplayResolver.resolveDisplays(sources) as Promise<Record<string, VerbatimsResolvedSourceDisplay>>
}

export const verbatimsSocialPublishableSourceResolver: SocialPublishableSourceResolver = {
  async resolveSource(input: SocialSourceRef & {
    baseSiteUrl: string
    platform: SocialAutopostPlatform
  }): Promise<SocialResolvedPublishableSource | null> {
  if (input.sourceType !== 'quote') {
    return null
  }

  const candidate = await db.select({
    quoteId: schema.quotes.id,
    quoteText: schema.quotes.name,
    quoteStatus: schema.quotes.status,
    authorName: schema.authors.name,
    referenceName: schema.quoteReferences.name
  })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .where(eq(schema.quotes.id, Number(input.sourceId)))
    .limit(1)
    .get()

  if (!candidate) {
    return null
  }

  return resolveVerbatimsQuoteContent({
    candidate,
    baseSiteUrl: input.baseSiteUrl,
    platform: input.platform
  })
  }
}

export async function resolveVerbatimsSourceContent(input: VerbatimsQueueSourceRef & {
  baseSiteUrl: string
  platform: SocialAutopostPlatform
}): Promise<VerbatimsResolvedQuoteContent | null> {
  return verbatimsSocialPublishableSourceResolver.resolveSource(input) as Promise<VerbatimsResolvedQuoteContent | null>
}

export function getVerbatimsFallbackCanonicalUrl(input: VerbatimsQueueSourceRef & { baseSiteUrl: string }): string {
  if (input.sourceType === 'quote') {
    return `${input.baseSiteUrl}/quotes/${input.sourceId}`
  }

  return input.baseSiteUrl
}

export function resolveVerbatimsQuoteContent(input: {
  candidate: VerbatimsQuoteQueueCandidate
  baseSiteUrl: string
  platform: SocialAutopostPlatform
}): VerbatimsResolvedQuoteContent | null {
  const quoteText = input.candidate.quoteText?.trim()
  if (!quoteText || input.candidate.quoteStatus !== 'approved') {
    return null
  }

  const canonicalUrl = `${input.baseSiteUrl}/quotes/${input.candidate.quoteId}`
  const attribution = buildVerbatimsAttribution(input.candidate)

  return {
    content: {
      sourceType: 'quote',
      sourceId: input.candidate.quoteId,
      primaryText: quoteText,
      canonicalUrl,
      attribution,
      description: quoteText,
      metadata: {
        quoteId: input.candidate.quoteId,
        quoteStatus: input.candidate.quoteStatus,
        authorName: input.candidate.authorName,
        referenceName: input.candidate.referenceName
      }
    },
    media: {
      url: getVerbatimsPlatformImageUrl(input.platform, {
        baseSiteUrl: input.baseSiteUrl,
        quoteId: input.candidate.quoteId
      })
    }
  }
}

function buildVerbatimsAttribution(candidate: VerbatimsQuoteQueueCandidate): string | undefined {
  const attributionParts: string[] = []
  if (candidate.authorName) attributionParts.push(candidate.authorName)
  if (candidate.referenceName) attributionParts.push(candidate.referenceName)

  if (!attributionParts.length) {
    return undefined
  }

  return `— ${attributionParts.join(' · ')}`
}

function getVerbatimsPlatformImageUrl(platform: SocialAutopostPlatform, input: { baseSiteUrl: string, quoteId: number }): string {
  if (platform === 'instagram' || platform === 'threads') {
    return `${input.baseSiteUrl}/api/social/images/quotes/${input.quoteId}.jpg`
  }

  if (platform === 'x' || platform === 'bluesky') {
    return `${input.baseSiteUrl}/api/social/images/quotes/${input.quoteId}.png`
  }

  if (platform === 'facebook' || platform === 'pinterest') {
    return `${input.baseSiteUrl}/api/social/images/quotes/${input.quoteId}.jpg`
  }

  return `${input.baseSiteUrl}/api/og/quotes/${input.quoteId}.png`
}
