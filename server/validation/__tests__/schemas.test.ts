import { describe, expect, it } from 'vitest'
import { createQuoteSchema, updateQuoteSchema } from '../schemas'

describe('quote source validation', () => {
  it('accepts a source on user quote creation', () => {
    const quote = createQuoteSchema.parse({
      name: 'A quote with evidence',
      source_type: 'book',
      source_url: 'https://example.com/edition',
    })

    expect(quote.source_type).toBe('book')
    expect(quote.source_url).toBe('https://example.com/edition')
  })

  it('accepts a source on quote updates', () => {
    const quote = updateQuoteSchema.parse({
      source_type: 'interview',
      source_url: 'https://example.com/interview',
    })

    expect(quote.source_type).toBe('interview')
    expect(quote.source_url).toBe('https://example.com/interview')
  })
})
