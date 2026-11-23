import { describe, expect, it, vi } from 'vitest'
vi.mock('hub:db', async () => ({ db: {}, schema: await import('../../db/schema') }))

import { parseCorrectionPayload } from '../quote-correction'

describe('parseCorrectionPayload', () => {
  const evidence = [{ source_id: 2, locator_type: 'page', locator_value: '14' }]

  it('accepts allowlisted quote edits with a source locator', () => {
    expect(parseCorrectionPayload({
      changes: { name: { before: 'Old wording', after: 'Correct wording' } }, evidence,
    }, 'quote').changes.name).toEqual({ before: 'Old wording', after: 'Correct wording' })
  })

  it('rejects fields outside the allowlist', () => {
    expect(() => parseCorrectionPayload({
      changes: { status: { before: 'approved', after: 'draft' } }, evidence,
    }, 'quote')).toThrow('Field is not allowed')
  })

  it('rejects changes without evidence and incomplete locators', () => {
    expect(() => parseCorrectionPayload({ changes: { language: { before: 'en', after: 'fr' } }, evidence: [] }, 'quote'))
      .toThrow('At least one source locator')
    expect(() => parseCorrectionPayload({
      changes: { language: { before: 'en', after: 'fr' } },
      evidence: [{ source_id: 2, locator_type: 'page', locator_value: ' ' }],
    }, 'quote')).toThrow('exact locator')
  })

  it('accepts only documented nullable attribution fields', () => {
    expect(parseCorrectionPayload({
      changes: { notes: { before: null, after: 'Updated note' } }, evidence,
    }, 'attribution').changes.notes).toEqual({ before: null, after: 'Updated note' })
    expect(() => parseCorrectionPayload({
      changes: { author_id: { before: 3, after: null } }, evidence,
    }, 'attribution')).toThrow('cannot be null')
  })
})
