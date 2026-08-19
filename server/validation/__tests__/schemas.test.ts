import { describe, expect, it } from 'vitest'
import { createQuoteSchema, createV1QuoteSchema, updateQuoteSchema, updateV1QuoteSchema } from '../schemas'

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

  it('rejects legacy fields on v1 writes', () => {
    expect(() => createV1QuoteSchema.parse({ name: 'Legacy v1 payload', author_id: 1 })).toThrow()
  })

  it('accepts a complete v1 multi-attribution payload', () => {
    const quote = createV1QuoteSchema.parse({
      name: 'A quote with competing attributions',
      attributions: [
        { author_id: 1, is_primary: true, status: 'manually_verified' },
        { reference_id: 2, is_primary: false, notes: 'Alternative attribution' },
      ],
    })

    expect(quote.attributions).toHaveLength(2)
    expect(quote.attributions?.filter(attribution => attribution.is_primary)).toHaveLength(1)
  })

  it('requires exactly one primary attribution on v1 writes', () => {
    expect(() => createV1QuoteSchema.parse({
      name: 'No primary attribution',
      attributions: [{ author_id: 1, is_primary: false }],
    })).toThrow()
    expect(() => createV1QuoteSchema.parse({
      name: 'Two primary attributions',
      attributions: [{ author_id: 1, is_primary: true }, { reference_id: 2, is_primary: true }],
    })).toThrow()
  })

  it('rejects mixed v1 replacement and legacy primary fields', () => {
    expect(() => updateV1QuoteSchema.parse({
      attributions: [{ author_id: 1, is_primary: true }],
      provenance: { reference_id: 2 },
    })).toThrow()
  })
})
