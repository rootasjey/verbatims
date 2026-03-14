export type AuthorEnrichmentProposalField =
  | 'birth_date'
  | 'birth_location'
  | 'death_date'
  | 'death_location'
  | 'job'
  | 'description'
  | 'image_url'
  | 'socials'

export type ReferenceEnrichmentProposalField =
  | 'release_date'
  | 'description'
  | 'image_url'
  | 'urls'

export type EnrichmentProposalField = AuthorEnrichmentProposalField | ReferenceEnrichmentProposalField

export interface EnrichmentFieldProposal {
  field: EnrichmentProposalField
  label: string
  current_value: string | null
  proposed_value: string | null
  confidence: number
  overwrite: boolean
  recommended: boolean
  source_labels: string[]
  source_urls: string[]
  rationale: string
}

export interface EnrichmentMatchSummary {
  source: 'wikidata'
  external_id: string
  label: string
  description?: string | null
  wikipedia_url?: string | null
  wikidata_url: string
  score: number
}

export interface BaseEnrichmentPreview {
  entity_type: 'author' | 'reference'
  entity_id: number
  entity_name: string
  generated_at: string
  match: EnrichmentMatchSummary | null
  proposals: EnrichmentFieldProposal[]
  review_required: boolean
  auto_apply_fields: string[]
  summary: {
    proposed_count: number
    recommended_count: number
    skipped_count: number
  }
  notes: string[]
}

export interface AuthorEnrichmentPreview extends BaseEnrichmentPreview {
  entity_type: 'author'
  entity_name: string
  author_name: string
}

export interface ReferenceEnrichmentPreview extends BaseEnrichmentPreview {
  entity_type: 'reference'
  entity_name: string
  reference_name: string
  reference_primary_type: string
}

export type EntityEnrichmentPreview = AuthorEnrichmentPreview | ReferenceEnrichmentPreview
