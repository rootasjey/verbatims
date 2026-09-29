import { describe, expect, it } from 'vitest'
import { resolveQuoteLanguage } from '../quote-language'

describe('quote language detection', () => {
  it('maps confident detector results to the supported quote language', () => {
    expect(resolveQuoteLanguage('long enough quote text', { language: 'fra', confidence: 0.9 })).toBe('fr')
    expect(resolveQuoteLanguage('long enough quote text', { language: 'jpn', confidence: 0.9 })).toBe('ja')
  })

  it('uses the local fallback when the detector is uncertain or returns an unsupported code', () => {
    const frenchQuote = 'La vie est belle quand on partage nos rêves.'
    expect(resolveQuoteLanguage(frenchQuote, { language: 'eng', confidence: 0.2 })).toBe('fr')
    expect(resolveQuoteLanguage(frenchQuote, { language: 'und', confidence: 0.99 })).toBe('fr')
  })

  it('defaults to English when no supported detection or local French signal is available', () => {
    expect(resolveQuoteLanguage('A sufficiently long sentence with no detector result.')).toBe('en')
  })
})
