import { describe, expect, it } from 'vitest'
import { canAutomaticallyEnrich } from '#shared/constants/enrichment'

describe('enrichment automatic policy', () => {
  it('allows only high-confidence matches', () => {
    expect(canAutomaticallyEnrich('high')).toBe(true)
  })

  it.each(['medium', 'low', 'ambiguous'] as const)('rejects %s matches', (confidence) => {
    expect(canAutomaticallyEnrich(confidence)).toBe(false)
  })
})
