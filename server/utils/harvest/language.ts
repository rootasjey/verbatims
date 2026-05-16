import type { QuoteLanguage } from '#shared/types/quote'

const FRENCH_INDICATORS = /[èéêëàâäùûüôöîïçœæ]|\b(dans|avec|pour|sur|que|qui|est|pas|plus|dit|être|faire|comme|tout|bien|sans|leur|deux|même|petit|grand|jour|monde|amour|mort|vie)\b/i
const ENGLISH_SHORT_WORDS = /\b(the|and|you|are|was|not|but|his|her|him|she|has|had|can|all|one|our|out|new|now|how|who|why|when|from|they|this|that|with|have|been|will|just|like|some|than|then|them|more|very|much|many|such|only|over|also|even|most|make|know|see|get|say|go|come|think|take|give|look|use|find|tell|ask|work|seem|feel|try|call|keep|let|begin|show|hear|play|run|move|live|mean|need|want|thing|time|year|good|great|other|world|life|hand|part|place|case|week|fact|group|number|cause|point|word|each|long|little|old|might|ever|yet|way|people|states|country|still|well|since|every|could)\b/i

export function detectQuoteLanguage(text: string, fallback: QuoteLanguage): QuoteLanguage {
  const cleaned = text.replace(/[""'«»]/g, '').trim()
  if (cleaned.length < 20) return fallback

  const hasFrenchChars = FRENCH_INDICATORS.test(cleaned)
  const englishWordMatches = (cleaned.match(ENGLISH_SHORT_WORDS) || []).length
  const totalWords = cleaned.split(/\s+/).length
  const englishDensity = totalWords > 0 ? englishWordMatches / totalWords : 0

  const isLikelyFrench = hasFrenchChars && englishDensity < 0.15

  if (isLikelyFrench) return 'fr'
  return fallback
}