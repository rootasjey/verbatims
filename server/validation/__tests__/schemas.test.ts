import { describe, expect, it } from 'vitest'
import { createQuoteOccurrenceSchema, createQuoteSchema, createQuoteSourceSchema, createV1QuoteSchema, updateQuoteSchema, updateQuoteSourceSchema, updateV1QuoteSchema } from '../schemas'

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

  it('accepts nullable provenance fields on quote updates', () => {
    const quote = updateQuoteSchema.parse({
      source_type: null,
      source_url: 'https://en.wikiquote.org/wiki/Example',
    })

    expect(quote.source_type).toBeNull()
    expect(quote.source_url).toBe('https://en.wikiquote.org/wiki/Example')
    expect(() => updateQuoteSchema.parse({ source_url: 'not a URL' })).toThrow()
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

describe('quote source validation', () => {
  it('accepts an optional translator credit and trims the value', () => {
    const source = createQuoteSourceSchema.parse({
      attribution_id: 1,
      source_type: 'book',
      translator_name: '  Marguerite Yourcenar  ',
    })

    expect(source.translator_name).toBe('Marguerite Yourcenar')
    expect(createQuoteSourceSchema.parse({ attribution_id: 1, source_type: 'book' }).translator_name).toBeUndefined()
  })

  it('accepts quote-level evidence without an attribution', () => {
    expect(createQuoteSourceSchema.parse({ source_type: 'interview' }).attribution_id).toBeNull()
    expect(createQuoteSourceSchema.parse({ attribution_id: null, occurrence_id: 8, source_type: 'interview' }).attribution_id).toBeNull()
  })

  it('accepts an optional link to a quote occurrence', () => {
    expect(createQuoteSourceSchema.parse({ attribution_id: 1, source_type: 'interview' }).occurrence_id).toBeNull()
    expect(createQuoteSourceSchema.parse({ attribution_id: 1, occurrence_id: 8, source_type: 'interview' }).occurrence_id).toBe(8)
  })

  it('accepts clearing a translator credit on source updates', () => {
    expect(updateQuoteSourceSchema.parse({ translator_name: null }).translator_name).toBeNull()
  })

  it('accepts a secondary author occurrence without a catalog work', () => {
    expect(createQuoteOccurrenceSchema.parse({ attribution_id: 1, author_id: 9, occurrence_type: 'quotation', context: 'An interview' })).toMatchObject({ author_id: 9, reference_id: null, occurrence_type: 'quotation' })
  })

  it('allows an occurrence without a specific attribution', () => {
    expect(createQuoteOccurrenceSchema.parse({ author_id: 9, reference_id: 3 })).toMatchObject({ attribution_id: null, author_id: 9, reference_id: 3 })
  })
})
