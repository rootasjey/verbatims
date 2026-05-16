export const HARVEST_SOURCE_TYPES = ['wikiquote-fr', 'wikiquote-en'] as const
export type HarvestSourceType = (typeof HARVEST_SOURCE_TYPES)[number]

export const HARVEST_LOG_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const
export type HarvestLogStatus = (typeof HARVEST_LOG_STATUSES)[number]

export const HARVEST_SOURCE_LABELS: Record<HarvestSourceType, string> = {
  'wikiquote-fr': 'WikiQuote (Français)',
  'wikiquote-en': 'WikiQuote (English)',
}

export const HARVEST_SOURCE_LANGUAGES: Record<HarvestSourceType, string> = {
  'wikiquote-fr': 'fr',
  'wikiquote-en': 'en',
}

export function isHarvestSourceType(value: string): value is HarvestSourceType {
  return (HARVEST_SOURCE_TYPES as readonly string[]).includes(value)
}