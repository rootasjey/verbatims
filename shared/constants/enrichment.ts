export const ENRICHMENT_ENTITY_TYPES = ['author', 'reference'] as const

export type EnrichmentEntityType = (typeof ENRICHMENT_ENTITY_TYPES)[number]

export const ENRICHMENT_JOB_REASONS = ['never_verified', 'stale', 'manual', 'retry'] as const
export type EnrichmentJobReason = (typeof ENRICHMENT_JOB_REASONS)[number]

export const ENRICHMENT_JOB_STATUSES = ['queued', 'processing', 'completed', 'failed', 'cancelled'] as const
export type EnrichmentJobStatus = (typeof ENRICHMENT_JOB_STATUSES)[number]

export const ENRICHMENT_VERIFICATION_STATUSES = ['queued', 'processing', 'verified', 'review', 'failed'] as const
export type EnrichmentVerificationStatus = (typeof ENRICHMENT_VERIFICATION_STATUSES)[number]

export const ENRICHMENT_TRIGGER_SOURCES = ['cron', 'manual'] as const
export type EnrichmentTriggerSource = (typeof ENRICHMENT_TRIGGER_SOURCES)[number]

export function isEnrichmentEntityType(value: string): value is EnrichmentEntityType {
  return (ENRICHMENT_ENTITY_TYPES as readonly string[]).includes(value)
}

export function isEnrichmentJobStatus(value: string): value is EnrichmentJobStatus {
  return (ENRICHMENT_JOB_STATUSES as readonly string[]).includes(value)
}
