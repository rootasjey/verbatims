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

const REFERENCE_ICON_TONES: Record<QuoteReferencePrimaryType, string> = {
  book: 'text-green-700 dark:text-green-400',
  film: 'text-blue-700 dark:text-blue-400',
  tv_series: 'text-purple-700 dark:text-purple-400',
  music: 'text-pink-700 dark:text-pink-400',
  speech: 'text-red-700 dark:text-red-400',
  podcast: 'text-indigo-700 dark:text-indigo-400',
  interview: 'text-amber-700 dark:text-amber-400',
  documentary: 'text-teal-700 dark:text-teal-400',
  media_stream: 'text-cyan-700 dark:text-cyan-400',
  writings: 'text-slate-700 dark:text-slate-300',
  video_game: 'text-amber-700 dark:text-amber-400',
  other: 'text-gray-600 dark:text-gray-400',
}

export function getReferenceBadgeColor(type?: string | null, fallback = DEFAULT_REFERENCE_BADGE_COLOR): string {
  if (!type) return fallback

  return REFERENCE_BADGE_COLORS[type as QuoteReferencePrimaryType] || fallback
}

export function getReferenceIconTone(type?: string | null): string {
  if (!type) return REFERENCE_ICON_TONES.other

  return REFERENCE_ICON_TONES[type as QuoteReferencePrimaryType] || REFERENCE_ICON_TONES.other
}
