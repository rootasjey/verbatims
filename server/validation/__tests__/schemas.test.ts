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
    expect(quote.attributions?.[0]).not.toHaveProperty('author_id')
    const clearedAuthor = updateQuoteSchema.parse({
      attributions: [{ author_id: null, is_primary: true }],
    })
    expect(clearedAuthor.attributions?.[0]?.author_id).toBeNull()
    expect(clearedAuthor.attributions?.[0]).not.toHaveProperty('reference_id')
    const clearedReference = updateQuoteSchema.parse({
      attributions: [{ reference_id: null, is_primary: true }],
    })
    expect(clearedReference.attributions?.[0]?.reference_id).toBeNull()
    expect(clearedReference.attributions?.[0]).not.toHaveProperty('author_id')
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

  it('rejects web-only source snapshot fields on v1 quote updates', () => {
    expect(() => updateV1QuoteSchema.parse({
      sources: [],
      source_snapshot_ids: [],
      source_snapshot: [],
      delete_source_ids: [],
    })).toThrow()
  })

  it('keeps a 100-source quote with ten additions editable and caps additions per update', () => {
    const snapshotFor = (length: number) => Array.from({ length }, (_, index) => ({
      id: index + 1,
      attribution_id: null,
      occurrence_id: null,
      source_type: 'book',
      source_medium: null,
      source_url: null,
      label: null,
      locator_type: null,
      locator_value: null,
      translator_name: null,
      verification_status: 'unverified' as const,
      verified_by: null,
      verified_at: null,
      notes: null,
      is_primary: false,
    }))
    const existingSources = Array.from({ length: 100 }, (_, index) => ({ id: index + 1, source_type: 'book' }))
    const addedSources = Array.from({ length: 10 }, (_, index) => ({ source_url: `https://example.com/source-${index}` }))
    const firstUpdate = updateQuoteSchema.parse({
      sources: [...existingSources, ...addedSources],
      source_snapshot_ids: Array.from({ length: 100 }, (_, index) => index + 1),
      source_snapshot: snapshotFor(100),
    })
    expect(firstUpdate.sources).toHaveLength(110)

    const reopened = updateQuoteSchema.parse({
      sources: Array.from({ length: 110 }, (_, index) => ({ id: index + 1, source_type: 'book' })),
      source_snapshot_ids: Array.from({ length: 110 }, (_, index) => index + 1),
      source_snapshot: snapshotFor(110),
    })
    expect(reopened.sources).toHaveLength(110)
    const bulkDelete = updateQuoteSchema.parse({
      sources: [],
      source_snapshot_ids: Array.from({ length: 110 }, (_, index) => index + 1),
      source_snapshot: snapshotFor(110),
      delete_source_ids: Array.from({ length: 110 }, (_, index) => index + 1),
    })
    expect(bulkDelete.delete_source_ids).toHaveLength(110)

    const addedTooMany = Array.from({ length: 11 }, (_, index) => ({ source_url: `https://example.com/extra-${index}` }))
    expect(() => updateQuoteSchema.parse({ sources: addedTooMany })).toThrow()
  })

  it('rejects a new source whose whitespace-only label normalizes to empty without a URL', () => {
    expect(() => updateQuoteSchema.parse({
      sources: [{ label: '   ' }],
    })).toThrow()
  })

  it('rejects a new source whose locator value normalizes to empty', () => {
    expect(() => updateQuoteSchema.parse({
      sources: [{ label: 'Source', locator_type: 'page', locator_value: '   ' }],
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
