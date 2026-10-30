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
import { getSocialImageDesignConfig } from '~~/server/utils/social-image-design-config'
import { getPrimaryQuoteProvenance } from '~~/server/utils/quote-provenance'

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
  quoteId: number | null
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
    .innerJoin(schema.quoteAttributions, eq(schema.quotes.id, schema.quoteAttributions.quoteId))
    .leftJoin(schema.authors, eq(schema.quoteAttributions.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quoteAttributions.referenceId, schema.quoteReferences.id))
    .where(and(
      eq(schema.socialQueue.sourceType, 'quote'),
      or(
        like(schema.quotes.name, `%${normalizedSearch}%`),
        like(schema.authors.name, `%${normalizedSearch}%`),
        like(schema.quoteReferences.name, `%${normalizedSearch}%`)
      )
    ))
    .groupBy(schema.socialQueue.sourceType, schema.socialQueue.sourceId)

  const [authors, references, themes] = await Promise.all([
    db.select({ sourceId: schema.authors.id }).from(schema.authors).where(like(schema.authors.name, `%${normalizedSearch}%`)).limit(50),
    db.select({ sourceId: schema.quoteReferences.id }).from(schema.quoteReferences).where(like(schema.quoteReferences.name, `%${normalizedSearch}%`)).limit(50),
    db.select({ sourceId: schema.themes.id }).from(schema.themes).where(like(schema.themes.name, `%${normalizedSearch}%`)).limit(50)
  ])

  return [
    ...matches.map(match => ({
    sourceType: match.sourceType,
    sourceId: match.sourceId
    })),
    ...authors.map(source => ({ sourceType: 'author', sourceId: source.sourceId })),
    ...references.map(source => ({ sourceType: 'reference', sourceId: source.sourceId })),
    ...themes.map(source => ({ sourceType: 'theme', sourceId: source.sourceId }))
  ]
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
    })
      .from(schema.quotes)
      .where(inArray(schema.quotes.id, quoteSourceIds))

    const provenance = await getPrimaryQuoteProvenance(quotes.map(quote => quote.quoteId))

    for (const quote of quotes) {
      const quoteProvenance = provenance.get(quote.quoteId)
      const attribution = quoteProvenance?.attributions.find(item => item.is_primary) ?? quoteProvenance?.attributions[0]
      const authorName = attribution?.author?.name ?? null
      const referenceName = attribution?.reference?.name ?? null
      const secondaryText = [authorName, referenceName].filter(Boolean).join(' · ')
      const key = getSocialSourceKey({ sourceType: 'quote', sourceId: quote.quoteId })
      resolved[key] = {
        sourceType: 'quote',
        sourceId: quote.quoteId,
        quoteId: quote.quoteId,
        quoteText: quote.quoteText,
        quoteLanguage: quote.quoteLanguage,
        authorName,
        referenceName,
        canonicalPath: `/quotes/${quote.quoteId}`,
        title: authorName,
        subtitle: referenceName,
        primaryText: quote.quoteText,
        secondaryText: secondaryText || null,
        language: quote.quoteLanguage,
        metadata: {
          quoteId: quote.quoteId,
          quoteText: quote.quoteText,
          quoteLanguage: quote.quoteLanguage,
          authorName,
          referenceName,
        }
      }
    }
  }

  for (const source of uniqueSources.filter(item => item.sourceType === 'author' || item.sourceType === 'reference' || item.sourceType === 'theme')) {
    const id = Number(source.sourceId)
    if (!Number.isSafeInteger(id) || id < 1) continue
    const entity = source.sourceType === 'author'
      ? await db.select({ id: schema.authors.id, title: schema.authors.name, subtitle: schema.authors.job, imageUrl: schema.authors.imageUrl }).from(schema.authors).where(eq(schema.authors.id, id)).limit(1).get()
      : source.sourceType === 'reference'
        ? await db.select({ id: schema.quoteReferences.id, title: schema.quoteReferences.name, subtitle: schema.quoteReferences.primaryType, imageUrl: schema.quoteReferences.imageUrl }).from(schema.quoteReferences).where(eq(schema.quoteReferences.id, id)).limit(1).get()
        : await db.select({ id: schema.themes.id, title: schema.themes.name, subtitle: schema.themes.description, imageUrl: schema.themes.imageUrl, slug: schema.themes.slug }).from(schema.themes).where(eq(schema.themes.id, id)).limit(1).get()
    if (!entity) continue
    const canonicalPath = source.sourceType === 'author'
      ? `/authors/${id}`
      : source.sourceType === 'reference'
        ? `/references/${id}`
        : `/?theme=${encodeURIComponent('slug' in entity ? String(entity.slug) : String(id))}`
    resolved[getSocialSourceKey(source)] = {
      sourceType: source.sourceType,
      sourceId: id,
      quoteId: null,
      quoteText: null,
      quoteLanguage: null,
      authorName: source.sourceType === 'author' ? entity.title : null,
      referenceName: source.sourceType === 'reference' ? entity.title : null,
      canonicalPath,
      title: entity.title,
      subtitle: entity.subtitle || null,
      primaryText: entity.title,
      secondaryText: entity.subtitle || null,
      language: null,
      metadata: { imageUrl: entity.imageUrl || null }
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
    const id = Number(input.sourceId)
    if (!Number.isSafeInteger(id) || id < 1) return null
    const entity = input.sourceType === 'author'
      ? await db.select({ id: schema.authors.id, name: schema.authors.name, description: schema.authors.description, imageUrl: schema.authors.imageUrl, imageAlt: schema.authors.imageAlt, imageCredit: schema.authors.imageCredit, imageCreditStatus: schema.authors.imageCreditStatus, imageLicenseStatus: schema.authors.imageLicenseStatus, job: schema.authors.job }).from(schema.authors).where(eq(schema.authors.id, id)).limit(1).get()
      : input.sourceType === 'reference'
        ? await db.select({ id: schema.quoteReferences.id, name: schema.quoteReferences.name, description: schema.quoteReferences.description, imageUrl: schema.quoteReferences.imageUrl, imageAlt: schema.quoteReferences.imageAlt, imageCredit: schema.quoteReferences.imageCredit, imageCreditStatus: schema.quoteReferences.imageCreditStatus, imageLicenseStatus: schema.quoteReferences.imageLicenseStatus, primaryType: schema.quoteReferences.primaryType }).from(schema.quoteReferences).where(eq(schema.quoteReferences.id, id)).limit(1).get()
        : input.sourceType === 'theme'
          ? await db.select({ id: schema.themes.id, slug: schema.themes.slug, name: schema.themes.name, description: schema.themes.description, language: schema.themes.language, imageUrl: schema.themes.imageUrl, imageAlt: schema.themes.imageAlt, imageCredit: schema.themes.imageCredit, imageLicense: schema.themes.imageLicense }).from(schema.themes).where(and(eq(schema.themes.id, id), eq(schema.themes.isActive, true))).limit(1).get()
          : null
    if (!entity) return null
    const path = input.sourceType === 'author' ? `/authors/${id}` : input.sourceType === 'reference' ? `/references/${id}` : `/?theme=${encodeURIComponent('slug' in entity ? String(entity.slug) : String(id))}`
    const imageHasDocumentedRights = 'imageLicenseStatus' in entity
      ? entity.imageLicenseStatus === 'documented' && entity.imageCreditStatus !== 'unknown'
      : 'imageLicense' in entity && Boolean(entity.imageLicense?.trim() && entity.imageCredit?.trim())
    const imageUrl = imageHasDocumentedRights && 'imageUrl' in entity && entity.imageUrl
      ? (/^https?:\/\//i.test(entity.imageUrl) ? entity.imageUrl : `${input.baseSiteUrl.replace(/\/$/, '')}/${entity.imageUrl.replace(/^\//, '')}`)
      : null
    const credit = 'imageCredit' in entity ? entity.imageCredit?.trim() : ''
    const attribution = credit ? `Image: ${credit}` : undefined
    const kind = input.sourceType === 'author' ? 'spotlight' : input.sourceType === 'reference' ? 'work' : 'theme'
    const title = entity.name
    const subtitle = 'job' in entity ? entity.job : 'primaryType' in entity ? entity.primaryType : null
    const body = entity.description?.trim()
    const primaryText = input.sourceType === 'author'
      ? [`Portrait in focus: ${title}`, subtitle].filter(Boolean).join(' · ')
      : input.sourceType === 'reference'
        ? [`A work to explore: ${title}`, subtitle].filter(Boolean).join(' · ')
        : 'language' in entity && entity.language === 'fr'
          ? `Découvrez le thème ${title}`
          : `Discover our ${title} theme`
    return {
      content: {
        sourceType: input.sourceType,
        sourceId: id,
        primaryText,
        canonicalUrl: `${input.baseSiteUrl.replace(/\/$/, '')}${path}`,
        title,
        description: body || primaryText,
        attribution,
        metadata: { kind, imageCreditStatus: 'imageCreditStatus' in entity ? entity.imageCreditStatus : null, imageLicenseStatus: 'imageLicenseStatus' in entity ? entity.imageLicenseStatus : null }
      },
      media: imageUrl ? { url: imageUrl, alt: 'imageAlt' in entity ? entity.imageAlt || title : title } : null
    }
  }

  const candidate = await db.select({
    quoteId: schema.quotes.id,
    quoteText: schema.quotes.name,
    quoteStatus: schema.quotes.status,
  })
    .from(schema.quotes)
    .where(eq(schema.quotes.id, Number(input.sourceId)))
    .limit(1)
    .get()

  if (!candidate) {
    return null
  }

  const provenance = await getPrimaryQuoteProvenance([candidate.quoteId])
  const quoteProvenance = provenance.get(candidate.quoteId)
  const attribution = quoteProvenance?.attributions.find(item => item.is_primary) ?? quoteProvenance?.attributions[0]

  return await resolveVerbatimsQuoteContent({
    candidate: {
      ...candidate,
      authorName: attribution?.author?.name ?? null,
      referenceName: attribution?.reference?.name ?? null,
    },
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

  if (input.sourceType === 'author') return `${input.baseSiteUrl}/authors/${input.sourceId}`
  if (input.sourceType === 'reference') return `${input.baseSiteUrl}/references/${input.sourceId}`
  if (input.sourceType === 'theme') return input.baseSiteUrl

  return input.baseSiteUrl
}

export async function resolveVerbatimsQuoteContent(input: {
  candidate: VerbatimsQuoteQueueCandidate
  baseSiteUrl: string
  platform: SocialAutopostPlatform
}): Promise<VerbatimsResolvedQuoteContent | null> {
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
      url: await getVerbatimsPlatformImageUrl(input.platform, {
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

async function getVerbatimsPlatformImageUrl(platform: SocialAutopostPlatform, input: { baseSiteUrl: string, quoteId: number }): Promise<string> {
  const ext = platform === 'instagram' || platform === 'threads' || platform === 'facebook' || platform === 'pinterest' ? 'jpg' : 'png'

  let url = `${input.baseSiteUrl}/api/social/images/quotes/${input.quoteId}.${ext}`

  try {
    const config = await getSocialImageDesignConfig()

    const params = new URLSearchParams()
    params.set('background', config.background)
    params.set('theme', config.theme)
    url += `?${params.toString()}`
  } catch {
    // If the config can't be loaded, just use the defaults (solid, light)
  }

  return url
}
