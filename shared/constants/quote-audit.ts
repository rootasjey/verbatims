export const QUOTE_AUDIT_PROGRESS = [
  'pending',
  'in_progress',
  'awaiting_review',
  'reviewed',
] as const

export const QUOTE_AUDIT_OUTCOMES = [
  'source_candidate_found',
  'possible_misattribution',
  'primary_source_confirmed',
  'no_primary_source_found',
  'disputed',
  'inconclusive',
] as const

export type QuoteAuditProgress = typeof QUOTE_AUDIT_PROGRESS[number]
export type QuoteAuditOutcome = typeof QUOTE_AUDIT_OUTCOMES[number]
