import { describe, expect, it } from 'vitest'
import { isPersistedQuoteSource, resolveQuoteSourceAttributionId } from '../../../app/utils/quote-source-edit'

describe('quote source editing after attribution replacement', () => {
  it('recreates a source whose row was removed with its old attribution', () => {
    const currentSourceIds = new Set<number>()

    expect(isPersistedQuoteSource(12, currentSourceIds)).toBe(false)
  })

  it('reattaches a source to the current primary attribution when its old attribution was replaced', () => {
    const currentAttributionIds = new Set([20])

    expect(resolveQuoteSourceAttributionId(10, currentAttributionIds, 20)).toBe(20)
    expect(resolveQuoteSourceAttributionId(20, currentAttributionIds, 20)).toBe(20)
  })
})
