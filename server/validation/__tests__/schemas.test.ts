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

  it('accepts modern primary provenance on quote writes', () => {
    const quote = createQuoteSchema.parse({
      name: 'A quote with normalized provenance',
      provenance: {
        author_id: 1,
        reference_id: 2,
        status: 'unverified',
        source: {
          source_type: 'book',
          source_url: 'https://example.com/book',
          label: 'First edition',
        },
      },
    })

    expect(quote.provenance?.source?.source_type).toBe('book')
    expect(quote.provenance?.source?.label).toBe('First edition')
  })

  it('rejects legacy fields on v1 writes', async () => {
    const { createV1QuoteSchema } = await import('../schemas')
    expect(() => createV1QuoteSchema.parse({ name: 'Legacy v1 payload', author_id: 1 })).toThrow()
  })
})
