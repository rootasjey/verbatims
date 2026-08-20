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
})
