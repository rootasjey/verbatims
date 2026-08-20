import type { EnrichmentMatchConfidence } from '#shared/types/enrichment'

const MATCH_GAP_FOR_HIGH_CONFIDENCE = 15
const MATCH_GAP_FOR_MEDIUM_CONFIDENCE = 8

export function resolveMatchConfidence(
  score: number,
  competingScore: number | null,
  signals: string[],
  ambiguousMatchGap = 5,
): EnrichmentMatchConfidence {
  const gap = competingScore === null ? null : Math.abs(score - competingScore)
  const hasConflict = signals.some(signal => /does not align|conflicts/i.test(signal))

  if (hasConflict) return 'ambiguous'
  if (score < 66) return 'low'
  if (competingScore === null) {
    if (score >= 82) return 'high'
    if (score >= 72) return 'medium'
    return 'low'
  }
  if ((gap ?? 0) < ambiguousMatchGap) return 'ambiguous'
  if (score >= 82 && (gap ?? 0) >= MATCH_GAP_FOR_HIGH_CONFIDENCE) return 'high'
  if (score >= 72 && (gap ?? 0) >= MATCH_GAP_FOR_MEDIUM_CONFIDENCE) return 'medium'
  return 'low'
}

export function applyCorroborationToConfidence(
  confidence: string | null | undefined,
  agreementScore: number,
): string | null | undefined {
  if (confidence !== 'medium' || agreementScore < 20) return confidence
  return 'high'
}
