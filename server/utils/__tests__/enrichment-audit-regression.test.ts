import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { canAutomaticallyEnrich } from '#shared/constants/enrichment'

interface RegressionCase {
  referenceId: number
  name: string
  decision: 'accepted' | 'ambiguous_match' | 'no_match'
  confidence: 'high' | 'medium' | 'low' | 'ambiguous' | null
}

const fixture = JSON.parse(readFileSync(resolve(process.cwd(), 'server/utils/__tests__/fixtures/enrichment-audit-regression.json'), 'utf8')) as RegressionCase[]

describe('enrichment audit regression fixture', () => {
  it('contains the representative audit cases', () => {
    expect(fixture.length).toBeGreaterThanOrEqual(8)
    expect(fixture.map(item => item.referenceId)).toContain(210)
    expect(fixture.map(item => item.referenceId)).toContain(248)
  })

  it('never marks a non-high-confidence case as accepted', () => {
    for (const item of fixture) {
      if (item.decision === 'accepted') expect(item.confidence).toBe('high')
      if (item.confidence) expect(canAutomaticallyEnrich(item.confidence)).toBe(item.decision === 'accepted')
    }
  })
})
