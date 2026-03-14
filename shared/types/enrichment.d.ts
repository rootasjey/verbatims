export type EnrichmentProposalField =
  | 'birth_date'
  | 'birth_location'
  | 'death_date'
  | 'death_location'
  | 'job'
  | 'description'
  | 'image_url'
  | 'socials'

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

export interface AuthorEnrichmentPreview {
  entity_type: 'author'
  entity_id: number
  author_name: string
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
