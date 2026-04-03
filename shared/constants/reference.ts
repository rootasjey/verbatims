import type { QuoteReferencePrimaryType } from '#shared/types/quote-reference'

export const DEFAULT_REFERENCE_BADGE_COLOR = '#9ca3af'

const REFERENCE_BADGE_COLORS: Record<QuoteReferencePrimaryType, string> = {
  book: '#22c55e',
  film: '#3b82f6',
  tv_series: '#a855f7',
  music: '#ec4899',
  speech: '#ef4444',
  podcast: '#6366f1',
  interview: '#f59e0b',
  documentary: '#14b8a6',
  media_stream: '#06b6d4',
  writings: '#94a3b8',
  video_game: '#f59e0b',
  other: '#9ca3af',
}

export function getReferenceBadgeColor(type?: string | null, fallback = DEFAULT_REFERENCE_BADGE_COLOR): string {
  if (!type) return fallback

  return REFERENCE_BADGE_COLORS[type as QuoteReferencePrimaryType] || fallback
}