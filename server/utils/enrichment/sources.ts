export type EnrichmentSourceId = 'wikidata' | 'tvmaze' | 'musicbrainz'

export interface EnrichmentSourceStatus {
  id: EnrichmentSourceId
  name: string
  configured: boolean
  reachable: boolean
  status: 'ok' | 'not_configured' | 'unreachable' | 'error'
  message: string
  checkedAt: string
  latencyMs: number
}

export interface ExternalEntityCandidate {
  source: EnrichmentSourceId
  externalId: string
  label: string
  description: string | null
  url: string | null
  imageUrl: string | null
  releaseDate: string | null
  matchScore?: number
  kind?: 'recording' | 'release_group'
}

export interface ExternalCorroboration {
  agreementScore: number
  sourceSignals: string[]
  conflicts: string[]
}

export interface MusicContext {
  artists: string[]
  albums: string[]
}

const SOURCE_CHECKS: Array<{
  id: EnrichmentSourceId
  name: string
  check: () => Promise<{ configured: boolean; url: string; headers?: HeadersInit }>
}> = [
  {
    id: 'wikidata',
    name: 'Wikidata',
    check: async () => ({
      configured: true,
      url: 'https://www.wikidata.org/w/api.php?action=wbsearchentities&search=Verbatims&language=en&format=json&limit=1',
      headers: { 'accept': 'application/json', 'user-agent': 'VerbatimsBot/0.1 (+https://verbatims.cc)' },
    }),
  },
  {
    id: 'tvmaze',
    name: 'TVmaze',
    check: async () => ({
      configured: true,
      url: 'https://api.tvmaze.com/singlesearch/shows?q=How%20I%20Met%20Your%20Mother',
      headers: { accept: 'application/json' },
    }),
  },
  {
    id: 'musicbrainz',
    name: 'MusicBrainz',
    check: async () => ({
      configured: true,
      url: 'https://musicbrainz.org/ws/2/artist/?query=artist%3ARadiohead&fmt=json&limit=1',
      headers: { accept: 'application/json', 'user-agent': 'Verbatims/1.0 (https://verbatims.cc)' },
    }),
  },
]

export async function checkEnrichmentSources(): Promise<EnrichmentSourceStatus[]> {
  return await Promise.all(SOURCE_CHECKS.map(async (source) => {
    const checkedAt = new Date().toISOString()
    const startedAt = Date.now()
    const request = await source.check()
    if (!request.configured) {
      return { id: source.id, name: source.name, configured: false, reachable: false, status: 'not_configured', message: 'Credential is not configured.', checkedAt, latencyMs: 0 }
    }

    try {
      const response = await fetch(request.url, { headers: request.headers, signal: AbortSignal.timeout(10_000) })
      return {
        id: source.id,
        name: source.name,
        configured: true,
        reachable: response.ok,
        status: response.ok ? 'ok' : 'error',
        message: response.ok ? 'Source responded successfully.' : `Source returned HTTP ${response.status}.`,
        checkedAt,
        latencyMs: Date.now() - startedAt,
      }
    } catch (error) {
      return { id: source.id, name: source.name, configured: true, reachable: false, status: 'unreachable', message: error instanceof Error ? error.message : 'Request failed.', checkedAt, latencyMs: Date.now() - startedAt }
    }
  }))
}

export async function searchTvmazeShows(query: string): Promise<ExternalEntityCandidate[]> {
  const url = new URL('https://api.tvmaze.com/search/shows')
  url.searchParams.set('q', query)
  const response = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(10_000) })
  if (!response.ok) return []
  const payload = await response.json() as Array<{ show?: { id?: number; name?: string; summary?: string | null; url?: string; image?: { medium?: string; original?: string } | null; premiered?: string | null } }>
  return payload.flatMap(({ show }) => show?.id && show.name ? [{
    source: 'tvmaze' as const,
    externalId: String(show.id),
    label: show.name,
    description: stripHtml(show.summary),
    url: show.url || null,
    imageUrl: show.image?.original || show.image?.medium || null,
    releaseDate: show.premiered || null,
  }] : [])
}

export async function searchMusicBrainzRecordings(query: string): Promise<ExternalEntityCandidate[]> {
  const url = new URL('https://musicbrainz.org/ws/2/recording/')
  url.searchParams.set('query', `recording:${query}`)
  url.searchParams.set('fmt', 'json')
  url.searchParams.set('limit', '10')
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'Verbatims/1.0 (https://verbatims.cc)' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) return []
  const payload = await response.json() as { recordings?: Array<{ id?: string; title?: string; disambiguation?: string; 'first-release-date'?: string; 'artist-credit'?: Array<{ name?: string }> }> }
  return (payload.recordings || []).flatMap((recording) => recording.id && recording.title ? [{
    source: 'musicbrainz' as const,
    externalId: recording.id,
    label: recording.title,
    description: recording.disambiguation || recording['artist-credit']?.map(artist => artist.name).filter(Boolean).join(', ') || null,
    url: `https://musicbrainz.org/recording/${recording.id}`,
    imageUrl: null,
    releaseDate: recording['first-release-date'] || null,
    matchScore: titleSimilarity(normalizeTitle(query), normalizeTitle(recording.title)),
    kind: 'recording' as const,
  }] : [])
    .filter(candidate => (candidate.matchScore || 0) >= 0.5)
    .sort((left, right) => (right.matchScore || 0) - (left.matchScore || 0))
    .slice(0, 10)
}

export async function searchMusicBrainzReleaseGroups(query: string): Promise<ExternalEntityCandidate[]> {
  const url = new URL('https://musicbrainz.org/ws/2/release-group/')
  url.searchParams.set('query', `releasegroup:${query}`)
  url.searchParams.set('fmt', 'json')
  url.searchParams.set('limit', '10')
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'Verbatims/1.0 (https://verbatims.cc)' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) return []
  const payload = await response.json() as { 'release-groups'?: Array<{ id?: string; title?: string; 'first-release-date'?: string; 'artist-credit'?: Array<{ name?: string }> }> }
  return (payload['release-groups'] || []).flatMap((group) => group.id && group.title ? [{
    source: 'musicbrainz' as const,
    externalId: group.id,
    label: group.title,
    description: group['artist-credit']?.map(artist => artist.name).filter(Boolean).join(', ') || null,
    url: `https://musicbrainz.org/release-group/${group.id}`,
    imageUrl: null,
    releaseDate: group['first-release-date'] || null,
    matchScore: titleSimilarity(normalizeTitle(query), normalizeTitle(group.title)),
    kind: 'release_group' as const,
  }] : [])
    .filter(candidate => (candidate.matchScore || 0) >= 0.5)
    .sort((left, right) => (right.matchScore || 0) - (left.matchScore || 0))
    .slice(0, 10)
}

export function evaluateExternalCorroboration(
  label: string | null | undefined,
  sources: Array<{ source: string, results: ExternalEntityCandidate[] }>,
  musicContext?: MusicContext,
  referenceReleaseDate?: string | null,
): ExternalCorroboration {
  const sourceSignals: string[] = []
  const conflicts: string[] = []
  const normalizedLabel = normalizeTitle(label)
  let agreementScore = 0

  for (const source of sources) {
    const best = source.results
      .map(candidate => ({ candidate, similarity: titleSimilarity(normalizedLabel, normalizeTitle(candidate.label)) }))
      .sort((left, right) => right.similarity - left.similarity)[0]
    if (best?.similarity === 1) {
      agreementScore += 25
      sourceSignals.push(`${source.source}: exact title match`)
      if (source.source === 'musicbrainz' && musicContext?.artists.length) {
        const artistMatch = source.results.some(candidate =>
          titleSimilarity(normalizeTitle(label), normalizeTitle(candidate.label)) === 1
          && musicContext.artists.some(artist => normalizeTitle(candidate.description).includes(normalizeTitle(artist)))
        )
        if (artistMatch) {
          agreementScore += 20
          sourceSignals.push('musicbrainz: exact title and Wikidata artist match')
        } else {
          conflicts.push('musicbrainz: exact titles found, but no Wikidata artist match')
        }
      }
      if (source.source === 'musicbrainz' && referenceReleaseDate) {
        const referenceYear = Number.parseInt(referenceReleaseDate.slice(0, 4), 10)
        const candidateYears = source.results
          .filter(candidate => titleSimilarity(normalizeTitle(label), normalizeTitle(candidate.label)) === 1)
          .filter(candidate => !musicContext?.artists.length || musicContext.artists.some(artist => normalizeTitle(candidate.description).includes(normalizeTitle(artist))))
          .map(candidate => candidate.releaseDate?.slice(0, 4))
          .filter((year): year is string => Boolean(year))
          .map(year => Number.parseInt(year, 10))
          .filter(year => Number.isFinite(year))
        const closestDelta = candidateYears.length > 0 ? Math.min(...candidateYears.map(year => Math.abs(year - referenceYear))) : null
        if (closestDelta === 0) {
          agreementScore += 10
          sourceSignals.push('musicbrainz: matching release year')
        } else if (closestDelta === 1) {
          agreementScore += 5
          sourceSignals.push('musicbrainz: release year within one year')
        }
      }
    } else if (best && best.similarity >= 0.7 && isTitleVariant(normalizedLabel, normalizeTitle(best.candidate.label))) {
      agreementScore += 20
      sourceSignals.push(`${source.source}: compatible title variant (${best.candidate.label})`)
    } else if (source.results.length > 0) {
      agreementScore -= 10
      conflicts.push(`${source.source}: candidates found, but no exact or compatible title match`)
    }
  }

  return { agreementScore, sourceSignals, conflicts }
}

function stripHtml(value: string | null | undefined): string | null {
  if (!value) return null
  const text = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text || null
}

function normalizeTitle(value: string | null | undefined): string {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function titleSimilarity(left: string, right: string): number {
  if (!left || !right) return 0
  if (left === right) return 1
  if (left.startsWith(`${right} `) || right.startsWith(`${left} `)) return 0.8
  const leftTokens = new Set(left.split(' ').filter(Boolean))
  const rightTokens = new Set(right.split(' ').filter(Boolean))
  const intersection = [...leftTokens].filter(token => rightTokens.has(token)).length
  return intersection / Math.max(leftTokens.size, rightTokens.size)
}

function isTitleVariant(left: string, right: string): boolean {
  return left.startsWith(`${right} `) || right.startsWith(`${left} `)
}
