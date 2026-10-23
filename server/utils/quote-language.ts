import type { H3Event } from 'h3'
import { ofetch } from 'ofetch'
import type { QuoteLanguage } from '#shared/types/quote'
import { detectQuoteLanguage as detectQuoteLanguageFallback } from './harvest/language'

const MIN_DETECTION_LENGTH = 12
const MIN_CONFIDENCE = 0.35
const SUPPORTED_ISO3_CODES = ['eng', 'fra', 'lat', 'spa', 'deu', 'ita', 'por', 'rus', 'jpn', 'cmn', 'zho']

const ISO3_TO_LANGUAGE: Record<string, QuoteLanguage> = {
  eng: 'en',
  fra: 'fr',
  fre: 'fr',
  lat: 'la',
  spa: 'es',
  deu: 'de',
  ger: 'de',
  ita: 'it',
  por: 'pt',
  rus: 'ru',
  jpn: 'ja',
  cmn: 'zh',
  zho: 'zh',
  en: 'en',
  fr: 'fr',
  es: 'es',
  de: 'de',
  it: 'it',
  pt: 'pt',
  ru: 'ru',
  ja: 'ja',
  zh: 'zh',
  la: 'la',
}

export interface LanguageDetectionResult {
  language: string
  confidence: number
}

export function resolveQuoteLanguage(text: string, detection?: LanguageDetectionResult | null): QuoteLanguage {
  const language = detection?.language ? ISO3_TO_LANGUAGE[detection.language.toLowerCase()] : undefined
  if (language && Number.isFinite(detection?.confidence) && (detection?.confidence ?? 0) >= MIN_CONFIDENCE) {
    return language
  }

  return detectQuoteLanguageFallback(text, 'en')
}

export async function detectSubmittedQuoteLanguage(event: H3Event, text: string): Promise<QuoteLanguage> {
  const fallback = detectQuoteLanguageFallback(text, 'en')
  const content = text.trim()
  if (content.length < MIN_DETECTION_LENGTH) return fallback

  const config = useRuntimeConfig(event)
  if (!config.francisApiKey) return fallback

  try {
    const detection = await ofetch<LanguageDetectionResult>(`${config.francisApiUrl}/api/v1/detect`, {
      method: 'POST',
      headers: { 'x-api-key': config.francisApiKey },
      body: {
        text: content,
        minLength: MIN_DETECTION_LENGTH,
        only: SUPPORTED_ISO3_CODES,
      },
      timeout: 3000,
    })

    return resolveQuoteLanguage(content, detection)
  } catch (error) {
    console.warn('Quote language detection failed; using the local fallback.', error)
    return fallback
  }
}
