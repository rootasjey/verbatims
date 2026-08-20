import { describe, expect, it } from 'vitest'
import { applyCorroborationToConfidence, resolveMatchConfidence } from '#shared/utils/enrichment-confidence'

describe('resolveMatchConfidence', () => {
  it('accepts a strong candidate without a competitor', () => expect(resolveMatchConfidence(98, null, [])).toBe('high'))
  it('keeps a medium candidate without a competitor reviewable', () => expect(resolveMatchConfidence(76, null, [])).toBe('medium'))
  it('rejects a weak candidate without a competitor', () => expect(resolveMatchConfidence(64, null, [])).toBe('low'))
  it('marks close candidates as ambiguous', () => expect(resolveMatchConfidence(110, 110, [])).toBe('ambiguous'))
  it('marks explicit conflicts as ambiguous', () => expect(resolveMatchConfidence(98, null, ['The selected candidate does not align cleanly with the expected reference type.'])).toBe('ambiguous'))
  it('raises only medium confidence with strong corroboration', () => {
    expect(applyCorroborationToConfidence('medium', 20)).toBe('high')
    expect(applyCorroborationToConfidence('low', 25)).toBe('low')
    expect(applyCorroborationToConfidence('ambiguous', 25)).toBe('ambiguous')
    expect(applyCorroborationToConfidence('medium', 10)).toBe('medium')
  })
})
