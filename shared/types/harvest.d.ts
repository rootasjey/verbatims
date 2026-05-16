import type { HarvestSourceType } from '#shared/constants/harvest'
import type { QuoteLanguage } from './quote'

export interface HarvestSearchResult {
  slug: string
  title: string
  description?: string
  quoteCount?: number
  url: string
  sourceType: HarvestSourceType
  language: string
}

export interface HarvestAuthorPreview {
  name: string
  slug: string
  url?: string
  description?: string
  birthDate?: string
  deathDate?: string
  job?: string
  imageUrl?: string
}

export interface HarvestReferencePreview {
  name: string
  type?: string
  url?: string
}

export interface HarvestQuotePreview {
  text: string
  language: QuoteLanguage
  author?: HarvestAuthorPreview
  reference?: HarvestReferencePreview
  sourceUrl: string
  sourceType: HarvestSourceType
  isDuplicate?: boolean
  duplicateQuoteId?: number
}

export interface HarvestImportPayload {
  sourceType: HarvestSourceType
  sourceUrl?: string
  quotes: HarvestQuoteImportItem[]
}

export interface HarvestQuoteImportItem {
  text: string
  language: QuoteLanguage
  author_id?: number
  new_author?: {
    name: string
    is_fictional?: boolean
    job?: string
    description?: string
    birth_date?: string
    death_date?: string
    image_url?: string
  }
  reference_id?: number
  new_reference?: {
    name: string
    primary_type: string
    original_language?: QuoteLanguage
    description?: string
  }
  tags?: number[]
  sourceUrl: string
}

export interface HarvestImportResult {
  totalQuotes: number
  imported: number
  skipped: number
  authorsCreated: number
  referencesCreated: number
  errors: string[]
}

export interface HarvestLogEntry {
  id: number
  sourceType: HarvestSourceType
  sourcePageSlug?: string
  sourcePageUrl?: string
  status: string
  quotesFound: number
  quotesImported: number
  quotesSkipped: number
  authorsCreated: number
  referencesCreated: number
  errorMessage?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
}