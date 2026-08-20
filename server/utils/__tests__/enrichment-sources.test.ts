import { describe, expect, it } from 'vitest'
import { evaluateExternalCorroboration } from '../enrichment/sources'

describe('evaluateExternalCorroboration', () => {
  it('recognizes a subtitle variant', () => {
    const result = evaluateExternalCorroboration('Arcane', [{
      source: 'tvmaze',
      results: [{ source: 'tvmaze', externalId: '1', label: 'Arcane: League of Legends', description: null, url: null, imageUrl: null, releaseDate: null }],
    }])
    expect(result.agreementScore).toBe(20)
    expect(result.conflicts).toHaveLength(0)
  })

  it('does not treat unrelated search results as corroboration', () => {
    const result = evaluateExternalCorroboration('Dr Who', [{
      source: 'tvmaze',
      results: [{ source: 'tvmaze', externalId: '1', label: 'Moving the Needle with Dr. Woo', description: null, url: null, imageUrl: null, releaseDate: null }],
    }])
    expect(result.agreementScore).toBe(-10)
    expect(result.conflicts).toHaveLength(1)
  })

  it('uses the Wikidata artist to corroborate an exact MusicBrainz title', () => {
    const result = evaluateExternalCorroboration('We Will Rock You', [{
      source: 'musicbrainz',
      results: [{ source: 'musicbrainz', externalId: '1', label: 'We Will Rock You', description: 'Queen', url: null, imageUrl: null, releaseDate: null }],
    }], { artists: ['Queen'], albums: [] })
    expect(result.agreementScore).toBe(45)
    expect(result.sourceSignals).toContain('musicbrainz: exact title and Wikidata artist match')
  })

  it('uses the release year only for exact MusicBrainz titles', () => {
    const result = evaluateExternalCorroboration('We Will Rock You', [{
      source: 'musicbrainz',
      results: [{ source: 'musicbrainz', externalId: '1', label: 'We Will Rock You', description: 'Queen', url: null, imageUrl: null, releaseDate: '1977-10-28' }],
    }], { artists: ['Queen'], albums: [] }, '1977-01-01')
    expect(result.agreementScore).toBe(55)
    expect(result.sourceSignals).toContain('musicbrainz: matching release year')
  })

  it('does not penalize an unrelated version date', () => {
    const result = evaluateExternalCorroboration('We Will Rock You', [{
      source: 'musicbrainz',
      results: [{ source: 'musicbrainz', externalId: '1', label: 'We Will Rock You', description: 'Warrant', url: null, imageUrl: null, releaseDate: '1992' }],
    }], { artists: ['Queen'], albums: [] }, '1977')
    expect(result.agreementScore).toBe(25)
    expect(result.conflicts).toHaveLength(1)
  })
})
