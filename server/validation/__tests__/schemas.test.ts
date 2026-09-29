import { describe, expect, it } from 'vitest'
import { createQuoteSchema, createV1QuoteSchema, updateQuoteSchema, updateV1QuoteSchema } from '../schemas'

describe('quote attribution validation', () => {
  it('accepts an attribution on user quote creation', () => {
    const quote = createQuoteSchema.parse({
      name: 'A quote with an attribution',
      attributions: [{ author_id: 1, is_primary: true }],
    })

    expect(quote.attributions[0]?.author_id).toBe(1)
    expect(quote.language).toBeUndefined()
  })

  it('accepts attribution replacement on quote updates', () => {
    const quote = updateQuoteSchema.parse({
      attributions: [{ reference_id: 2, is_primary: true }],
    })

    expect(quote.attributions?.[0]?.reference_id).toBe(2)
  })

  it('rejects historical root provenance fields', () => {
    expect(() => createQuoteSchema.parse({
      name: 'A quote with obsolete fields',
      attributions: [{ author_id: 1, is_primary: true }],
      provenance: { author_id: 1 },
    })).toThrow()
    expect(() => createQuoteSchema.parse({
      name: 'A quote with obsolete fields',
      attributions: [{ author_id: 1, is_primary: true }],
      source_type: 'book',
    })).toThrow()
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
