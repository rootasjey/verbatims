import type {
  EnrichmentAlternativeMatch,
  AuthorEnrichmentPreview,
  EnrichmentFieldProposal,
  EnrichmentMatchSummary,
  ReferenceEnrichmentPreview,
} from '#shared/types/enrichment'
import type { AuthorSocialLink } from '#shared/types/author'
import type { QuoteReferencePrimaryType, QuoteReferenceUrls } from '#shared/types/quote-reference'
import { parseAuthorSocials } from '../author-transformer'
import { resolveEnrichmentConfig } from './config'

interface WikidataSearchEntity {
  id: string
  label?: string
  description?: string
  match?: {
    type?: string
    language?: string
    text?: string
  }
  aliases?: string[]
}

interface WikidataEntityDocument {
  id: string
  labels?: Record<string, { value: string }>
  descriptions?: Record<string, { value: string }>
  claims?: Record<string, WikidataClaim[]>
  sitelinks?: Record<string, { title: string }>
}

interface WikidataClaim {
  mainsnak?: {
    datavalue?: {
      value?: any
    }
  }
  rank?: string
}

interface AuthorCandidate {
  match: EnrichmentMatchSummary
  alternativeMatches: EnrichmentAlternativeMatch[]
  birthDate: string | null
  birthLocation: string | null
  deathDate: string | null
  deathLocation: string | null
  job: string | null
  description: string | null
  imageUrl: string | null
  socials: AuthorSocialLink[]
}

interface ReferenceCandidate {
  match: EnrichmentMatchSummary
  alternativeMatches: EnrichmentAlternativeMatch[]
  releaseDate: string | null
  description: string | null
  imageUrl: string | null
  urls: QuoteReferenceUrls
}

interface AuthorRecordInput {
  id: number
  name: string
  birthDate?: string | null
  birthLocation?: string | null
  deathDate?: string | null
  deathLocation?: string | null
  job?: string | null
  description?: string | null
  imageUrl?: string | null
  socials?: string | null
  isFictional?: boolean | null
}

interface ReferenceRecordInput {
  id: number
  name: string
  primaryType: QuoteReferencePrimaryType
  releaseDate?: string | null
  description?: string | null
  imageUrl?: string | null
  urls?: string | null
}

interface ScoredWikidataCandidate {
  result: WikidataSearchEntity
  entity: WikidataEntityDocument | null
  score: number
  signals: string[]
}

interface MatchingThresholds {
  authorMatchMinScore: number
  referenceMatchMinScore: number
  ambiguousMatchGap: number
}

interface PreviewBuildOptions {
  preferredExternalId?: string | null
}

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php'
const WIKIDATA_ENTITY_API = 'https://www.wikidata.org/wiki/Special:EntityData'
const COMMONS_FILE_REDIRECT = 'https://commons.wikimedia.org/wiki/Special:Redirect/file'
const MATCH_GAP_FOR_MEDIUM_CONFIDENCE = 8
const MATCH_GAP_FOR_HIGH_CONFIDENCE = 15
const GENERIC_AUTHOR_DESCRIPTION_PATTERN = /(writer|author|poet|philosopher|novelist|journalist|playwright|screenwriter|essayist|composer|actor|human)/i
const COMPARABLE_STOP_WORDS = new Set([
  'a', 'an', 'and', 'at', 'as', 'also', 'by', 'for', 'from', 'in', 'into', 'is', 'known', 'of', 'on', 'or', 'the', 'to', 'with', 'who', 'was', 'were', 'born', 'former', 'professional', 'official', 'work', 'works', 'based', 'about', 'after', 'before', 'during', 'over', 'under', 'his', 'her', 'their', 'its', 'this', 'that', 'these', 'those'
])
const SEMANTIC_KEYWORD_GROUPS: Record<string, string[]> = {
  sports: ['athlete', 'basketball', 'football', 'soccer', 'tennis', 'baseball', 'olympic', 'sport', 'player', 'coach', 'nba'],
  science: ['scientist', 'biologist', 'mycologist', 'researcher', 'chemist', 'physicist', 'mathematician', 'academic'],
  writing: ['writer', 'author', 'poet', 'essayist', 'journalist', 'novelist', 'playwright', 'screenwriter'],
  entertainment: ['actor', 'actress', 'comedian', 'director', 'producer', 'musician', 'singer', 'announcer', 'television', 'radio'],
  politics: ['politician', 'president', 'minister', 'senator', 'governor', 'statesman', 'diplomat'],
  business: ['business', 'entrepreneur', 'executive', 'investor', 'founder', 'owner', 'ceo'],
  religion: ['priest', 'pastor', 'bishop', 'rabbi', 'imam', 'theologian'],
}
const REQUEST_HEADERS = {
  'accept': 'application/json',
  'user-agent': 'VerbatimsBot/0.1 (+https://verbatims.cc)'
}

export async function buildAuthorEnrichmentPreview(author: AuthorRecordInput, options: PreviewBuildOptions = {}): Promise<AuthorEnrichmentPreview> {
  const notes: string[] = []
  const matching = await resolveMatchingThresholds()

  if (author.isFictional) {
    return {
      entity_type: 'author',
      entity_id: author.id,
      entity_name: author.name,
      author_name: author.name,
      generated_at: new Date().toISOString(),
      match: null,
      alternative_matches: [],
      proposals: [],
      review_required: true,
      auto_apply_fields: [],
      summary: {
        proposed_count: 0,
        recommended_count: 0,
        skipped_count: 0,
      },
      notes: ['Fictional authors are not enriched automatically in this first version.']
    }
  }

  const candidate = await findBestAuthorCandidate(author, notes, matching, options)
  if (!candidate) {
    return {
      entity_type: 'author',
      entity_id: author.id,
      entity_name: author.name,
      author_name: author.name,
      generated_at: new Date().toISOString(),
      match: null,
      alternative_matches: [],
      proposals: [],
      review_required: true,
      auto_apply_fields: [],
      summary: {
        proposed_count: 0,
        recommended_count: 0,
        skipped_count: 0,
      },
      notes: notes.length > 0 ? notes : ['No reliable Wikidata match was found.']
    }
  }

  const proposals = createAuthorProposals(author, candidate)
  const recommendedCount = proposals.filter(proposal => proposal.recommended).length
  const autoApplyFields = proposals.filter(proposal => proposal.recommended && !proposal.overwrite).map(proposal => proposal.field)
  const reviewRequired = proposals.some(proposal => proposal.overwrite) || recommendedCount === 0

  return {
    entity_type: 'author',
    entity_id: author.id,
    entity_name: author.name,
    author_name: author.name,
    generated_at: new Date().toISOString(),
    match: candidate.match,
    alternative_matches: candidate.alternativeMatches,
    proposals,
    review_required: reviewRequired,
    auto_apply_fields: autoApplyFields,
    summary: {
      proposed_count: proposals.length,
      recommended_count: recommendedCount,
      skipped_count: 0,
    },
    notes,
  }
}

export async function buildReferenceEnrichmentPreview(reference: ReferenceRecordInput, options: PreviewBuildOptions = {}): Promise<ReferenceEnrichmentPreview> {
  const notes: string[] = []
  const matching = await resolveMatchingThresholds()
  const candidate = await findBestReferenceCandidate(reference, notes, matching, options)

  if (!candidate) {
    return {
      entity_type: 'reference',
      entity_id: reference.id,
      entity_name: reference.name,
      reference_name: reference.name,
      reference_primary_type: reference.primaryType,
      generated_at: new Date().toISOString(),
      match: null,
      alternative_matches: [],
      proposals: [],
      review_required: true,
      auto_apply_fields: [],
      summary: {
        proposed_count: 0,
        recommended_count: 0,
        skipped_count: 0,
      },
      notes: notes.length > 0 ? notes : ['No reliable Wikidata match was found for this reference.']
    }
  }

  const proposals = createReferenceProposals(reference, candidate)
  const recommendedCount = proposals.filter(proposal => proposal.recommended).length
  const autoApplyFields = proposals.filter(proposal => proposal.recommended && !proposal.overwrite).map(proposal => proposal.field)
  const reviewRequired = proposals.some(proposal => proposal.overwrite) || recommendedCount === 0

  return {
    entity_type: 'reference',
    entity_id: reference.id,
    entity_name: reference.name,
    reference_name: reference.name,
    reference_primary_type: reference.primaryType,
    generated_at: new Date().toISOString(),
    match: candidate.match,
    alternative_matches: candidate.alternativeMatches,
    proposals,
    review_required: reviewRequired,
    auto_apply_fields: autoApplyFields,
    summary: {
      proposed_count: proposals.length,
      recommended_count: recommendedCount,
      skipped_count: 0,
    },
    notes,
  }
}

async function findBestAuthorCandidate(
  author: AuthorRecordInput,
  notes: string[],
  matching: MatchingThresholds,
  options: PreviewBuildOptions,
) {
  const searchResults = await searchWikidata(author.name)
  if (searchResults.length === 0) {
    notes.push('Wikidata search returned no result for this author.')
    return null
  }

  const scoredResults = await scoreAuthorCandidates(author, searchResults)

  const best = resolvePreferredCandidate(scoredResults, options.preferredExternalId) || scoredResults[0]
  const second = scoredResults.find(candidate => candidate.result.id !== best?.result.id)
  if (!best || (!options.preferredExternalId && best.score < matching.authorMatchMinScore)) {
    notes.push('A candidate was found, but the identity confidence is too low for automated review.')
    return null
  }

  if (options.preferredExternalId && best.result.id === options.preferredExternalId) {
    notes.push('This preview uses a manually selected alternative Wikidata candidate.')
  }

  const entity = best.entity
  if (!entity) {
    notes.push('Failed to fetch the selected Wikidata entity details.')
    return null
  }

  const instanceOfIds = extractEntityIds(entity.claims?.P31)
  if (instanceOfIds.length > 0 && !instanceOfIds.includes('Q5')) {
    notes.push('The best match is not typed as a human on Wikidata, so the preview was rejected.')
    return null
  }

  const relatedIds = [
    ...extractEntityIds(entity.claims?.P19),
    ...extractEntityIds(entity.claims?.P20),
    ...extractEntityIds(entity.claims?.P106),
    ...extractEntityIds(entity.claims?.P27),
  ]
  const labels = relatedIds.length > 0 ? await fetchEntityLabels(relatedIds) : {}
  const birthDate = parseWikidataDate(getFirstTimeValue(entity.claims?.P569))
  const deathDate = parseWikidataDate(getFirstTimeValue(entity.claims?.P570))
  const birthLocation = labels[getFirstEntityId(entity.claims?.P19)] || null
  const deathLocation = labels[getFirstEntityId(entity.claims?.P20)] || null
  const citizenships = extractEntityIds(entity.claims?.P27).map(id => labels[id]).filter(Boolean)
  const occupations = extractEntityIds(entity.claims?.P106).map(id => labels[id]).filter(Boolean)
  const wikipediaUrl = buildWikipediaUrl(entity)
  const wikidataUrl = `https://www.wikidata.org/wiki/${entity.id}`
  const description = buildAuthorDescription(entity, occupations, citizenships, birthDate, deathDate)
  const imageFileName = getCommonsImageFileName(entity.claims?.P18)

  const socials = mergeAndNormalizeSocials([
    wikipediaUrl ? { platform: 'Wikipedia', url: wikipediaUrl } : null,
    { platform: 'Wikidata', url: wikidataUrl },
    getOfficialWebsite(entity.claims?.P856),
  ])
  const confidence = resolveMatchConfidence(best.score, second?.score ?? null, best.signals, matching.ambiguousMatchGap)
  const alternativeMatches = buildAlternativeMatches(scoredResults, best.result.id)

  if (confidence === 'ambiguous') {
    notes.push('Multiple Wikidata candidates are still close for this author; review carefully before applying changes.')
  }

  return {
    match: {
      source: 'wikidata',
      external_id: entity.id,
      label: getLabel(entity),
      description: getDescription(entity),
      wikipedia_url: wikipediaUrl,
      wikidata_url: wikidataUrl,
      score: Math.min(100, best.score),
      confidence,
      competing_score: second?.score ?? null,
      score_gap: computeScoreGap(best.score, second?.score ?? null),
      signals: best.signals,
      selected_manually: Boolean(options.preferredExternalId && best.result.id === options.preferredExternalId),
    },
    alternativeMatches,
    birthDate,
    birthLocation,
    deathDate,
    deathLocation,
    job: occupations.slice(0, 3).join(', ') || null,
    description,
    imageUrl: imageFileName ? buildCommonsImageUrl(imageFileName) : null,
    socials,
  } satisfies AuthorCandidate
}

function createAuthorProposals(author: AuthorRecordInput, candidate: AuthorCandidate): EnrichmentFieldProposal[] {
  const existingSocials = parseAuthorSocials(author.socials)
  const mergedSocials = mergeAndNormalizeSocials([...existingSocials, ...candidate.socials])

  const mappings: Array<{
    field: EnrichmentFieldProposal['field']
    label: string
    currentValue: string | null
    proposedValue: string | null
    confidence: number
    sourceLabels: string[]
    sourceUrls: string[]
    rationale: string
  }> = [
    {
      field: 'birth_date',
      label: 'Birth date',
      currentValue: normalizeNullableString(author.birthDate),
      proposedValue: normalizeNullableString(candidate.birthDate),
      confidence: 96,
      sourceLabels: ['Wikidata'],
      sourceUrls: [candidate.match.wikidata_url],
      rationale: 'Structured date from Wikidata.',
    },
    {
      field: 'birth_location',
      label: 'Birth location',
      currentValue: normalizeNullableString(author.birthLocation),
      proposedValue: normalizeNullableString(candidate.birthLocation),
      confidence: 88,
      sourceLabels: ['Wikidata'],
      sourceUrls: [candidate.match.wikidata_url],
      rationale: 'Structured place of birth from Wikidata.',
    },
    {
      field: 'death_date',
      label: 'Death date',
      currentValue: normalizeNullableString(author.deathDate),
      proposedValue: normalizeNullableString(candidate.deathDate),
      confidence: candidate.deathDate ? 95 : 0,
      sourceLabels: ['Wikidata'],
      sourceUrls: [candidate.match.wikidata_url],
      rationale: 'Structured date from Wikidata.',
    },
    {
      field: 'death_location',
      label: 'Death location',
      currentValue: normalizeNullableString(author.deathLocation),
      proposedValue: normalizeNullableString(candidate.deathLocation),
      confidence: candidate.deathLocation ? 86 : 0,
      sourceLabels: ['Wikidata'],
      sourceUrls: [candidate.match.wikidata_url],
      rationale: 'Structured place of death from Wikidata.',
    },
    {
      field: 'job',
      label: 'Profession',
      currentValue: normalizeNullableString(author.job),
      proposedValue: normalizeNullableString(candidate.job),
      confidence: candidate.job ? 84 : 0,
      sourceLabels: ['Wikidata'],
      sourceUrls: [candidate.match.wikidata_url],
      rationale: 'Occupation labels were derived from Wikidata claims.',
    },
    {
      field: 'description',
      label: 'Biography summary',
      currentValue: normalizeNullableString(author.description),
      proposedValue: normalizeNullableString(candidate.description),
      confidence: candidate.description ? 76 : 0,
      sourceLabels: ['Wikidata'],
      sourceUrls: [candidate.match.wikidata_url],
      rationale: 'Short factual summary generated from structured data, not copied from Wikipedia prose.',
    },
    {
      field: 'image_url',
      label: 'Profile image',
      currentValue: normalizeNullableString(author.imageUrl),
      proposedValue: normalizeNullableString(candidate.imageUrl),
      confidence: candidate.imageUrl ? 90 : 0,
      sourceLabels: ['Wikidata', 'Wikimedia Commons'],
      sourceUrls: [candidate.match.wikidata_url, candidate.match.wikipedia_url || 'https://commons.wikimedia.org'],
      rationale: 'Image file comes from Wikimedia Commons via Wikidata P18.',
    },
    {
      field: 'socials',
      label: 'External links',
      currentValue: existingSocials.length > 0 ? JSON.stringify(existingSocials) : null,
      proposedValue: mergedSocials.length > 0 ? JSON.stringify(mergedSocials) : null,
      confidence: mergedSocials.length > 0 ? 82 : 0,
      sourceLabels: ['Wikidata', 'Wikipedia'],
      sourceUrls: uniqueStrings(mergedSocials.map(link => link.url)),
      rationale: 'Wikipedia, Wikidata and official website links were merged without removing existing links.',
    },
  ]

  return mappings
    .filter(item => item.confidence > 0 && item.proposedValue)
    .filter(item => normalizeComparableString(item.currentValue) !== normalizeComparableString(item.proposedValue))
    .map((item) => {
      const overwrite = Boolean(item.currentValue)
      const confidence = adjustProposalConfidence(candidate.match, item.field, item.confidence)
      return {
        field: item.field,
        label: item.label,
        current_value: item.currentValue,
        proposed_value: item.proposedValue,
        confidence,
        overwrite,
        recommended: confidence >= (overwrite ? 92 : 78),
        source_labels: item.sourceLabels,
        source_urls: item.sourceUrls,
        rationale: withMatchRationale(item.rationale, candidate.match),
      }
    })
}

async function findBestReferenceCandidate(
  reference: ReferenceRecordInput,
  notes: string[],
  matching: MatchingThresholds,
  options: PreviewBuildOptions,
) {
  const searchResults = await searchWikidata(reference.name)
  if (searchResults.length === 0) {
    notes.push('Wikidata search returned no result for this reference.')
    return null
  }

  const scoredResults = await scoreReferenceCandidates(reference, searchResults)

  const best = resolvePreferredCandidate(scoredResults, options.preferredExternalId) || scoredResults[0]
  const second = scoredResults.find(candidate => candidate.result.id !== best?.result.id)
  if (!best || (!options.preferredExternalId && best.score < matching.referenceMatchMinScore)) {
    notes.push('A candidate was found, but the identity confidence is too low for manual review.')
    return null
  }

  if (options.preferredExternalId && best.result.id === options.preferredExternalId) {
    notes.push('This preview uses a manually selected alternative Wikidata candidate.')
  }

  const entity = best.entity
  if (!entity) {
    notes.push('Failed to fetch the selected Wikidata entity details.')
    return null
  }

  const instanceOfIds = extractEntityIds(entity.claims?.P31)
  const creatorIds = uniqueStrings([
    ...extractEntityIds(entity.claims?.P50),
    ...extractEntityIds(entity.claims?.P57),
    ...extractEntityIds(entity.claims?.P86),
    ...extractEntityIds(entity.claims?.P170),
    ...extractEntityIds(entity.claims?.P175),
  ])
  const labels = await fetchEntityLabels([...instanceOfIds, ...creatorIds])
  const instanceLabels = instanceOfIds.map(id => labels[id]).filter(Boolean)

  if (!matchesExpectedReferenceType(reference.primaryType, instanceLabels, getDescription(entity))) {
    notes.push('The selected Wikidata entity does not match the expected reference type closely enough.')
    return null
  }

  const releaseDate = parseWikidataDate(getFirstTimeValue(entity.claims?.P577))
  const wikipediaUrl = buildWikipediaUrl(entity)
  const wikidataUrl = `https://www.wikidata.org/wiki/${entity.id}`
  const imageFileName = getCommonsImageFileName(entity.claims?.P18)
  const description = buildReferenceDescription(entity, reference.primaryType, releaseDate, instanceLabels, labels)
  const urls = mergeReferenceUrls({}, {
    wikipedia: wikipediaUrl || undefined,
    official: getFirstUrlValue(entity.claims?.P856) || undefined,
    imdb: buildImdbUrl(entity.claims?.P345) || undefined,
  })
  const confidence = resolveMatchConfidence(best.score, second?.score ?? null, best.signals, matching.ambiguousMatchGap)
  const alternativeMatches = buildAlternativeMatches(scoredResults, best.result.id)

  if (confidence === 'ambiguous') {
    notes.push('Multiple Wikidata candidates are close for this reference; verify the selected entity before applying changes.')
  }

  return {
    match: {
      source: 'wikidata',
      external_id: entity.id,
      label: getLabel(entity),
      description: getDescription(entity),
      wikipedia_url: wikipediaUrl,
      wikidata_url: wikidataUrl,
      score: Math.min(100, best.score),
      confidence,
      competing_score: second?.score ?? null,
      score_gap: computeScoreGap(best.score, second?.score ?? null),
      signals: best.signals,
      selected_manually: Boolean(options.preferredExternalId && best.result.id === options.preferredExternalId),
    },
    alternativeMatches,
    releaseDate,
    description,
    imageUrl: imageFileName ? buildCommonsImageUrl(imageFileName) : null,
    urls: mergeReferenceUrls(urls, { wikidata: wikidataUrl }),
  } satisfies ReferenceCandidate
}

function createReferenceProposals(reference: ReferenceRecordInput, candidate: ReferenceCandidate): EnrichmentFieldProposal[] {
  const existingUrls = parseReferenceUrls(reference.urls)
  const mergedUrls = mergeReferenceUrls(existingUrls, candidate.urls)

  const mappings: Array<{
    field: EnrichmentFieldProposal['field']
    label: string
    currentValue: string | null
    proposedValue: string | null
    confidence: number
    sourceLabels: string[]
    sourceUrls: string[]
    rationale: string
  }> = [
    {
      field: 'release_date',
      label: 'Release date',
      currentValue: normalizeNullableString(reference.releaseDate),
      proposedValue: normalizeNullableString(candidate.releaseDate),
      confidence: candidate.releaseDate ? 94 : 0,
      sourceLabels: ['Wikidata'],
      sourceUrls: [candidate.match.wikidata_url],
      rationale: 'Structured publication or release date from Wikidata.',
    },
    {
      field: 'description',
      label: 'Reference summary',
      currentValue: normalizeNullableString(reference.description),
      proposedValue: normalizeNullableString(candidate.description),
      confidence: candidate.description ? 74 : 0,
      sourceLabels: ['Wikidata'],
      sourceUrls: [candidate.match.wikidata_url],
      rationale: 'Short factual summary derived from Wikidata labels and descriptions.',
    },
    {
      field: 'image_url',
      label: 'Cover or poster',
      currentValue: normalizeNullableString(reference.imageUrl),
      proposedValue: normalizeNullableString(candidate.imageUrl),
      confidence: candidate.imageUrl ? 88 : 0,
      sourceLabels: ['Wikidata', 'Wikimedia Commons'],
      sourceUrls: uniqueStrings([candidate.match.wikidata_url, candidate.match.wikipedia_url || 'https://commons.wikimedia.org']),
      rationale: 'Image file comes from Wikimedia Commons via Wikidata P18.',
    },
    {
      field: 'urls',
      label: 'External links',
      currentValue: stableStringifyReferenceUrls(existingUrls),
      proposedValue: stableStringifyReferenceUrls(mergedUrls),
      confidence: Object.keys(candidate.urls).length > 0 ? 82 : 0,
      sourceLabels: ['Wikidata', 'Wikipedia'],
      sourceUrls: uniqueStrings(Object.values(candidate.urls).filter((value): value is string => typeof value === 'string' && value.length > 0)),
      rationale: 'Reliable external links were merged with the existing reference URLs.',
    },
  ]

  return mappings
    .filter(item => item.confidence > 0 && item.proposedValue)
    .filter(item => normalizeComparableString(item.currentValue) !== normalizeComparableString(item.proposedValue))
    .map((item) => {
      const overwrite = Boolean(item.currentValue)
      const confidence = adjustProposalConfidence(candidate.match, item.field, item.confidence)
      return {
        field: item.field,
        label: item.label,
        current_value: item.currentValue,
        proposed_value: item.proposedValue,
        confidence,
        overwrite,
        recommended: confidence >= (overwrite ? 90 : 78),
        source_labels: item.sourceLabels,
        source_urls: item.sourceUrls,
        rationale: withMatchRationale(item.rationale, candidate.match),
      }
    })
}

async function scoreAuthorCandidates(author: AuthorRecordInput, searchResults: WikidataSearchEntity[]) {
  const hydrated = await hydrateSearchCandidates(searchResults)
  const relatedIds = uniqueStrings(hydrated.flatMap(({ entity }) => entity ? [
    ...extractEntityIds(entity.claims?.P31),
    ...extractEntityIds(entity.claims?.P106),
    ...extractEntityIds(entity.claims?.P27),
  ] : []))
  const labels = relatedIds.length > 0 ? await fetchEntityLabels(relatedIds) : {}

  return hydrated
    .map(({ result, entity }) => scoreAuthorSearchResult(author, result, entity, labels))
    .sort((left, right) => right.score - left.score)
}

async function scoreReferenceCandidates(reference: ReferenceRecordInput, searchResults: WikidataSearchEntity[]) {
  const hydrated = await hydrateSearchCandidates(searchResults)
  const relatedIds = uniqueStrings(hydrated.flatMap(({ entity }) => entity ? [
    ...extractEntityIds(entity.claims?.P31),
    ...extractEntityIds(entity.claims?.P50),
    ...extractEntityIds(entity.claims?.P57),
    ...extractEntityIds(entity.claims?.P86),
    ...extractEntityIds(entity.claims?.P170),
    ...extractEntityIds(entity.claims?.P175),
  ] : []))
  const labels = relatedIds.length > 0 ? await fetchEntityLabels(relatedIds) : {}

  return hydrated
    .map(({ result, entity }) => scoreReferenceSearchResult(reference, result, entity, labels))
    .sort((left, right) => right.score - left.score)
}

async function hydrateSearchCandidates(searchResults: WikidataSearchEntity[]) {
  return await Promise.all(searchResults.map(async (result) => ({
    result,
    entity: await fetchWikidataEntity(result.id),
  })))
}

function scoreAuthorSearchResult(
  author: AuthorRecordInput,
  result: WikidataSearchEntity,
  entity: WikidataEntityDocument | null,
  labels: Record<string, string>,
): ScoredWikidataCandidate {
  const normalizedAuthorName = normalizeComparableString(author.name)
  const normalizedLabel = normalizeComparableString(result.label)
  const normalizedMatchText = normalizeComparableString(result.match?.text)
  const aliases = result.aliases || []
  const aliasHaystack = normalizeComparableString(aliases.join(' '))
  const signals: string[] = []

  let score = 0
  if (normalizedAuthorName && normalizedAuthorName === normalizedLabel) score += 70
  else if (normalizedAuthorName && normalizedLabel.includes(normalizedAuthorName)) score += 55
  else if (normalizedAuthorName && aliasHaystack.includes(normalizedAuthorName)) score += 42

  if (normalizedAuthorName && normalizedMatchText === normalizedAuthorName) score += 15
  if (normalizedAuthorName && aliasHaystack === normalizedAuthorName) score += 10
  if (result.description && GENERIC_AUTHOR_DESCRIPTION_PATTERN.test(result.description)) score += 6

  if (!entity) {
    signals.push('Wikidata details for this candidate could not be loaded; confidence is reduced.')
    return { result, entity, score, signals }
  }

  const instanceOfIds = extractEntityIds(entity.claims?.P31)
  if (instanceOfIds.length > 0) {
    if (instanceOfIds.includes('Q5')) score += 6
    else {
      score -= 35
      signals.push('The selected candidate is not typed as a human in Wikidata.')
    }
  }

  const occupationLabels = extractEntityIds(entity.claims?.P106).map(id => labels[id]).filter(Boolean)
  const citizenshipLabels = extractEntityIds(entity.claims?.P27).map(id => labels[id]).filter(Boolean)
  const birthDate = parseWikidataDate(getFirstTimeValue(entity.claims?.P569))
  const deathDate = parseWikidataDate(getFirstTimeValue(entity.claims?.P570))
  const candidateContext = [
    result.description,
    getDescription(entity),
    occupationLabels.join(' '),
    citizenshipLabels.join(' '),
    aliases.join(' '),
  ].filter(Boolean).join(' ')

  if (author.birthDate) {
    const delta = scoreYearAlignment(author.birthDate, birthDate, 'birth date')
    score += delta.score
    if (delta.signal) signals.push(delta.signal)
  }

  if (author.deathDate) {
    const delta = scoreYearAlignment(author.deathDate, deathDate, 'death date')
    score += delta.score
    if (delta.signal) signals.push(delta.signal)
  }

  const jobAlignment = scoreSemanticAlignment(author.job, candidateContext, {
    positiveSignal: 'Existing profession aligns with the selected Wikidata occupations.',
    negativeSignal: 'Existing profession does not align with the selected Wikidata occupations.',
    exactBonus: 12,
    overlapBonus: 18,
    overlapStep: 6,
    mismatchPenalty: 24,
    weakPenalty: 6,
  })
  score += jobAlignment.score
  if (jobAlignment.signal) signals.push(jobAlignment.signal)

  const descriptionAlignment = scoreSemanticAlignment(author.description, candidateContext, {
    positiveSignal: 'Existing biography context overlaps with the selected Wikidata description.',
    negativeSignal: 'Existing biography context conflicts with the selected Wikidata description.',
    exactBonus: 6,
    overlapBonus: 12,
    overlapStep: 4,
    mismatchPenalty: 10,
    weakPenalty: 4,
  })
  score += descriptionAlignment.score
  if (descriptionAlignment.signal) signals.push(descriptionAlignment.signal)

  return {
    result,
    entity,
    score,
    signals: uniqueStrings(signals),
  }
}

function scoreReferenceSearchResult(
  reference: ReferenceRecordInput,
  result: WikidataSearchEntity,
  entity: WikidataEntityDocument | null,
  labels: Record<string, string>,
): ScoredWikidataCandidate {
  const normalizedReferenceName = normalizeComparableString(reference.name)
  const normalizedLabel = normalizeComparableString(result.label)
  const normalizedMatchText = normalizeComparableString(result.match?.text)
  const aliasHaystack = normalizeComparableString(result.aliases?.join(' '))
  const signals: string[] = []

  let score = 0
  if (normalizedReferenceName && normalizedReferenceName === normalizedLabel) score += 68
  else if (normalizedReferenceName && normalizedLabel.includes(normalizedReferenceName)) score += 52
  else if (normalizedReferenceName && aliasHaystack.includes(normalizedReferenceName)) score += 38

  if (normalizedReferenceName && normalizedMatchText === normalizedReferenceName) score += 12
  if (normalizedReferenceName && aliasHaystack === normalizedReferenceName) score += 8

  const searchHaystack = `${normalizeComparableString(result.description)} ${aliasHaystack}`
  const typeKeywords = getReferenceTypeKeywords(reference.primaryType)
  if (typeKeywords.some(keyword => searchHaystack.includes(keyword))) score += 12

  if (!entity) {
    signals.push('Wikidata details for this reference candidate could not be loaded; confidence is reduced.')
    return { result, entity, score, signals }
  }

  const instanceOfIds = extractEntityIds(entity.claims?.P31)
  const instanceLabels = instanceOfIds.map(id => labels[id]).filter(Boolean)
  if (matchesExpectedReferenceType(reference.primaryType, instanceLabels, getDescription(entity))) score += 18
  else if (reference.primaryType !== 'other') {
    score -= 24
    signals.push('The selected candidate does not align cleanly with the expected reference type.')
  }

  const releaseDate = parseWikidataDate(getFirstTimeValue(entity.claims?.P577))
  if (reference.releaseDate) {
    const delta = scoreYearAlignment(reference.releaseDate, releaseDate, 'release date', 16, 12)
    score += delta.score
    if (delta.signal) signals.push(delta.signal)
  }

  const candidateContext = [
    result.description,
    getDescription(entity),
    instanceLabels.join(' '),
    result.aliases?.join(' '),
  ].filter(Boolean).join(' ')
  const descriptionAlignment = scoreSemanticAlignment(reference.description, candidateContext, {
    positiveSignal: 'Existing reference summary overlaps with the selected Wikidata description.',
    negativeSignal: 'Existing reference summary conflicts with the selected Wikidata description.',
    exactBonus: 4,
    overlapBonus: 10,
    overlapStep: 4,
    mismatchPenalty: 8,
    weakPenalty: 4,
  })
  score += descriptionAlignment.score
  if (descriptionAlignment.signal) signals.push(descriptionAlignment.signal)

  return {
    result,
    entity,
    score,
    signals: uniqueStrings(signals),
  }
}

function matchesExpectedReferenceType(
  primaryType: QuoteReferencePrimaryType,
  instanceLabels: string[],
  description: string | null,
) {
  if (primaryType === 'other') return true

  const keywords = getReferenceTypeKeywords(primaryType)
  const haystack = normalizeComparableString([...instanceLabels, description || ''].join(' '))
  return keywords.some(keyword => haystack.includes(keyword))
}

function getReferenceTypeKeywords(primaryType: QuoteReferencePrimaryType) {
  const keywordsByType: Record<QuoteReferencePrimaryType, string[]> = {
    book: ['book', 'novel', 'written work', 'literary work', 'comic'],
    film: ['film', 'movie'],
    tv_series: ['television series', 'tv series', 'television program', 'anime series'],
    music: ['song', 'album', 'single', 'musical work'],
    speech: ['speech', 'lecture', 'address'],
    podcast: ['podcast'],
    interview: ['interview'],
    documentary: ['documentary', 'documentary film'],
    media_stream: ['web series', 'streaming television series', 'television program', 'series'],
    writings: ['essay', 'article', 'written work', 'book'],
    video_game: ['video game', 'computer game', 'game'],
    other: [],
  }

  return keywordsByType[primaryType]
}

function buildReferenceDescription(
  entity: WikidataEntityDocument,
  primaryType: QuoteReferencePrimaryType,
  releaseDate: string | null,
  instanceLabels: string[],
  labels: Record<string, string>,
) {
  const wikidataDescription = getDescription(entity)
  const releaseYear = releaseDate?.slice(0, 4)
  if (wikidataDescription) {
    const normalized = capitalize(wikidataDescription)
    if (!releaseYear || normalized.includes(releaseYear)) return normalized
    return `${normalized} (${releaseYear}).`
  }

  const creatorIds = uniqueStrings([
    ...extractEntityIds(entity.claims?.P50),
    ...extractEntityIds(entity.claims?.P57),
    ...extractEntityIds(entity.claims?.P86),
    ...extractEntityIds(entity.claims?.P170),
    ...extractEntityIds(entity.claims?.P175),
  ])
  const creators = creatorIds.map(id => labels[id]).filter(Boolean).slice(0, 2)
  const typeLabel = instanceLabels[0] || primaryType.replace(/_/g, ' ')

  if (releaseYear && creators.length > 0) return `${releaseYear} ${typeLabel.toLowerCase()} by ${creators.join(' and ')}.`
  if (releaseYear) return `${releaseYear} ${typeLabel.toLowerCase()}.`
  if (creators.length > 0) return `${capitalize(typeLabel)} by ${creators.join(' and ')}.`
  return capitalize(typeLabel)
}

function parseReferenceUrls(raw: string | null | undefined): QuoteReferenceUrls {
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') return {}

    const filteredEntries = Object.entries(parsed).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0
    )

    return Object.fromEntries(filteredEntries) as QuoteReferenceUrls
  } catch {
    return {}
  }
}

function mergeReferenceUrls(current: QuoteReferenceUrls, next: QuoteReferenceUrls) {
  const merged = { ...current } satisfies QuoteReferenceUrls

  for (const [key, value] of Object.entries(next)) {
    if (!value || typeof value !== 'string') continue
    if (!merged[key]) merged[key] = value
  }

  return merged
}

function stableStringifyReferenceUrls(urls: QuoteReferenceUrls) {
  const entries = Object.entries(urls)
    .filter(([, value]) => typeof value === 'string' && value.length > 0)
    .sort(([left], [right]) => left.localeCompare(right))

  if (entries.length === 0) return null
  return JSON.stringify(Object.fromEntries(entries))
}

function getFirstUrlValue(claims?: WikidataClaim[]) {
  const url = claims?.[0]?.mainsnak?.datavalue?.value
  return typeof url === 'string' && url ? url : null
}

function buildImdbUrl(claims?: WikidataClaim[]) {
  const imdbId = claims?.[0]?.mainsnak?.datavalue?.value
  if (!imdbId || typeof imdbId !== 'string') return null
  return `https://www.imdb.com/title/${encodeURIComponent(imdbId)}/`
}

async function searchWikidata(name: string) {
  const url = new URL(WIKIDATA_API)
  url.searchParams.set('action', 'wbsearchentities')
  url.searchParams.set('format', 'json')
  url.searchParams.set('language', 'en')
  url.searchParams.set('limit', '8')
  url.searchParams.set('type', 'item')
  url.searchParams.set('search', name)

  const payload = await fetchJson<{ search?: WikidataSearchEntity[] }>(url.toString())
  return payload?.search || []
}

async function fetchWikidataEntity(id: string) {
  const payload = await fetchJson<{ entities?: Record<string, WikidataEntityDocument> }>(`${WIKIDATA_ENTITY_API}/${id}.json`)
  return payload?.entities?.[id] || null
}

async function fetchEntityLabels(ids: string[]) {
  const uniqueIds = uniqueStrings(ids)
  if (uniqueIds.length === 0) return {} as Record<string, string>

  const url = new URL(WIKIDATA_API)
  url.searchParams.set('action', 'wbgetentities')
  url.searchParams.set('format', 'json')
  url.searchParams.set('languages', 'en')
  url.searchParams.set('ids', uniqueIds.join('|'))
  url.searchParams.set('props', 'labels')

  const payload = await fetchJson<{ entities?: Record<string, WikidataEntityDocument> }>(url.toString())
  const entries = payload?.entities || {}
  const labels: Record<string, string> = {}

  for (const [id, entity] of Object.entries(entries)) {
    const label = getLabel(entity)
    if (label) labels[id] = label
  }

  return labels
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { headers: REQUEST_HEADERS })
    if (!response.ok) return null
    return await response.json() as T
  } catch (error) {
    console.error('Failed to fetch enrichment source:', error)
    return null
  }
}

function scoreYearAlignment(
  currentValue: string,
  candidateValue: string | null,
  label: string,
  exactBonus = 18,
  mismatchPenalty = 14,
) {
  const currentYear = currentValue.slice(0, 4)
  const candidateYear = candidateValue?.slice(0, 4)

  if (!currentYear || !candidateYear) return { score: 0, signal: null as string | null }
  if (currentYear === candidateYear) return { score: exactBonus, signal: `Existing ${label} matches the Wikidata year.` }

  return {
    score: -mismatchPenalty,
    signal: `Existing ${label} conflicts with the Wikidata year.`
  }
}

function scoreSemanticAlignment(
  currentText: string | null | undefined,
  candidateText: string | null | undefined,
  options: {
    positiveSignal: string
    negativeSignal: string
    exactBonus: number
    overlapBonus: number
    overlapStep: number
    mismatchPenalty: number
    weakPenalty: number
  },
) {
  const currentNormalized = normalizeComparableString(currentText)
  const candidateNormalized = normalizeComparableString(candidateText)
  if (!currentNormalized || !candidateNormalized) return { score: 0, signal: null as string | null }

  if (candidateNormalized.includes(currentNormalized) || currentNormalized.includes(candidateNormalized)) {
    return { score: options.exactBonus, signal: options.positiveSignal }
  }

  const currentTokens = tokenizeComparableText(currentText)
  const candidateTokens = tokenizeComparableText(candidateText)
  if (currentTokens.length === 0 || candidateTokens.length === 0) return { score: 0, signal: null as string | null }

  const overlapCount = countTokenOverlap(currentTokens, candidateTokens)
  if (overlapCount > 0) {
    return {
      score: Math.min(options.overlapBonus, overlapCount * options.overlapStep),
      signal: options.positiveSignal,
    }
  }

  const currentGroups = detectSemanticGroups(currentText)
  const candidateGroups = detectSemanticGroups(candidateText)
  if (currentGroups.length > 0 && candidateGroups.length > 0 && !currentGroups.some(group => candidateGroups.includes(group))) {
    return {
      score: -options.mismatchPenalty,
      signal: options.negativeSignal,
    }
  }

  return {
    score: currentTokens.length >= 2 ? -options.weakPenalty : 0,
    signal: currentTokens.length >= 2 ? options.negativeSignal : null,
  }
}

function resolveMatchConfidence(
  score: number,
  competingScore: number | null,
  signals: string[],
  ambiguousMatchGap = 5,
): NonNullable<EnrichmentMatchSummary['confidence']> {
  const gap = computeScoreGap(score, competingScore)
  const hasConflict = signals.some(signal => /does not align|conflicts/i.test(signal))

  if (hasConflict || score < 66 || (gap !== null && gap < ambiguousMatchGap)) return 'ambiguous'
  if (score >= 82 && gap >= MATCH_GAP_FOR_HIGH_CONFIDENCE) return 'high'
  if (score >= 72 && gap >= MATCH_GAP_FOR_MEDIUM_CONFIDENCE) return 'medium'
  return 'low'
}

function buildAlternativeMatches(scoredResults: ScoredWikidataCandidate[], selectedExternalId?: string) {
  return scoredResults
    .filter(candidate => candidate.result.id !== selectedExternalId)
    .slice(0, 3)
    .map(candidate => toAlternativeMatch(candidate))
}

function resolvePreferredCandidate(scoredResults: ScoredWikidataCandidate[], preferredExternalId?: string | null) {
  if (!preferredExternalId) return null
  return scoredResults.find(candidate => candidate.result.id === preferredExternalId) || null
}

function toAlternativeMatch(candidate: ScoredWikidataCandidate): EnrichmentAlternativeMatch {
  const label = getLabel(candidate.entity) || candidate.result.label || candidate.result.id
  const description = getDescription(candidate.entity) || candidate.result.description || null
  const wikipediaUrl = candidate.entity ? buildWikipediaUrl(candidate.entity) : null

  return {
    source: 'wikidata',
    external_id: candidate.result.id,
    label,
    description,
    wikipedia_url: wikipediaUrl,
    wikidata_url: `https://www.wikidata.org/wiki/${candidate.result.id}`,
    score: Math.min(100, candidate.score),
    signals: candidate.signals,
  }
}

async function resolveMatchingThresholds(): Promise<MatchingThresholds> {
  const config = await resolveEnrichmentConfig()

  return {
    authorMatchMinScore: config.values.authorMatchMinScore,
    referenceMatchMinScore: config.values.referenceMatchMinScore,
    ambiguousMatchGap: config.values.ambiguousMatchGap,
  }
}

function computeScoreGap(score: number, competingScore: number | null) {
  if (typeof competingScore !== 'number') return null
  return Math.max(0, score - competingScore)
}

function adjustProposalConfidence(
  match: EnrichmentMatchSummary,
  field: EnrichmentFieldProposal['field'],
  baseConfidence: number,
) {
  const riskPenalty = isRiskyProposalField(field) ? 8 : 0

  if (match.confidence === 'high') return clampConfidence(baseConfidence)
  if (match.confidence === 'medium') return clampConfidence(baseConfidence - 4 - riskPenalty)
  if (match.confidence === 'low') return clampConfidence(baseConfidence - 10 - riskPenalty)
  if (match.confidence === 'ambiguous') return clampConfidence(baseConfidence - 18 - riskPenalty)
  return clampConfidence(baseConfidence)
}

function isRiskyProposalField(field: EnrichmentFieldProposal['field']) {
  return ['job', 'description', 'image_url', 'socials', 'urls'].includes(field)
}

function clampConfidence(value: number) {
  return Math.max(0, Math.min(99, Math.round(value)))
}

function withMatchRationale(baseRationale: string, match: EnrichmentMatchSummary) {
  if (match.confidence === 'high') return baseRationale
  if (match.confidence === 'medium') return `${baseRationale} Match confidence is moderate, so the field confidence was reduced slightly.`
  if (match.confidence === 'low') return `${baseRationale} Match confidence is limited, so this proposal should be reviewed manually.`
  if (match.confidence === 'ambiguous') return `${baseRationale} Match confidence is ambiguous because another Wikidata candidate remains plausible.`
  return baseRationale
}

function tokenizeComparableText(value: string | null | undefined) {
  return normalizeNullableString(value)
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .map(token => token.trim())
    .filter(token => token.length > 2 && !COMPARABLE_STOP_WORDS.has(token)) || []
}

function countTokenOverlap(left: string[], right: string[]) {
  const rightSet = new Set(right)
  return left.filter(token => rightSet.has(token)).length
}

function detectSemanticGroups(value: string | null | undefined) {
  const normalized = normalizeComparableString(value)
  if (!normalized) return [] as string[]

  return Object.entries(SEMANTIC_KEYWORD_GROUPS)
    .filter(([, keywords]) => keywords.some(keyword => normalized.includes(keyword)))
    .map(([group]) => group)
}

function parseWikidataDate(value: string | null) {
  if (!value) return null

  const match = value.match(/^([+-]\d{4,})-(\d{2})-(\d{2})T/)
  if (!match) return null

  const year = match[1].replace(/^\+/, '')
  const month = match[2]
  const day = match[3]
  if (month === '00') return year
  if (day === '00') return `${year}-${month}`
  return `${year}-${month}-${day}`
}

function buildAuthorDescription(
  entity: WikidataEntityDocument,
  occupations: string[],
  citizenships: string[],
  birthDate: string | null,
  deathDate: string | null,
) {
  const parts: string[] = []
  const citizenship = citizenships[0]
  const occupation = occupations.slice(0, 2).join(' and ')

  if (citizenship && occupation) parts.push(`${citizenship} ${occupation}`)
  else if (occupation) parts.push(occupation)
  else {
    const description = getDescription(entity)
    if (description) parts.push(description)
  }

  const dateLabel = formatLifeSpan(birthDate, deathDate)
  if (dateLabel) parts.push(dateLabel)

  if (parts.length === 0) return null
  return capitalize(parts.join(' '))
}

function formatLifeSpan(birthDate: string | null, deathDate: string | null) {
  const birthYear = birthDate?.slice(0, 4)
  const deathYear = deathDate?.slice(0, 4)

  if (birthYear && deathYear) return `(${birthYear}-${deathYear}).`
  if (birthYear) return `(born ${birthYear}).`
  return ''
}

function mergeAndNormalizeSocials(items: Array<AuthorSocialLink | null | undefined>) {
  const seen = new Set<string>()
  const merged: AuthorSocialLink[] = []

  for (const item of items) {
    if (!item?.url) continue
    const key = normalizeComparableString(item.url)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push({
      platform: item.platform,
      url: item.url,
      handle: item.handle || null,
      icon: item.icon || null,
    })
  }

  return merged
}

function getFirstTimeValue(claims?: WikidataClaim[]) {
  return claims?.[0]?.mainsnak?.datavalue?.value?.time || null
}

function getFirstEntityId(claims?: WikidataClaim[]) {
  return claims?.[0]?.mainsnak?.datavalue?.value?.id || ''
}

function extractEntityIds(claims?: WikidataClaim[]) {
  return claims
    ?.map(claim => claim.mainsnak?.datavalue?.value?.id)
    .filter((value): value is string => typeof value === 'string' && value.length > 0) || []
}

function getOfficialWebsite(claims?: WikidataClaim[]) {
  const url = claims?.[0]?.mainsnak?.datavalue?.value
  if (!url || typeof url !== 'string') return null
  return {
    platform: 'Official website',
    url,
  } satisfies AuthorSocialLink
}

function getCommonsImageFileName(claims?: WikidataClaim[]) {
  const filename = claims?.[0]?.mainsnak?.datavalue?.value
  return typeof filename === 'string' && filename ? filename : null
}

function buildCommonsImageUrl(filename: string) {
  return `${COMMONS_FILE_REDIRECT}/${encodeURIComponent(filename)}?width=720`
}

function buildWikipediaUrl(entity: WikidataEntityDocument) {
  const sitelink = entity.sitelinks?.enwiki || entity.sitelinks?.frwiki
  if (!sitelink?.title) return null
  const host = entity.sitelinks?.enwiki ? 'en.wikipedia.org' : 'fr.wikipedia.org'
  return `https://${host}/wiki/${encodeURIComponent(sitelink.title.replace(/ /g, '_'))}`
}

function getLabel(entity?: WikidataEntityDocument | null) {
  return entity?.labels?.en?.value || entity?.labels?.fr?.value || null
}

function getDescription(entity?: WikidataEntityDocument | null) {
  return entity?.descriptions?.en?.value || entity?.descriptions?.fr?.value || null
}

function normalizeNullableString(value: string | null | undefined) {
  const next = String(value || '').trim()
  return next || null
}

function normalizeComparableString(value: string | null | undefined) {
  return normalizeNullableString(value)?.toLowerCase().replace(/\s+/g, ' ') || ''
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(value => typeof value === 'string' && value.length > 0)))
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}