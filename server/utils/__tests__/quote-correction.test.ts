import { describe, expect, it, vi } from 'vitest'
vi.mock('hub:db', async () => ({ db: {}, schema: await import('../../db/schema') }))

import { nestedErrorMessage, parseCorrectionPayload } from '../quote-correction'

describe('parseCorrectionPayload', () => {
  beforeEach(() => {
    vi.stubGlobal('throwServer', (_statusCode: number, message: string) => { throw new Error(message) })
  })

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

  it('validates nullable attribution fields and numeric IDs', () => {
    expect(parseCorrectionPayload({
      changes: { notes: { before: null, after: 'Updated note' } }, evidence,
    }, 'attribution').changes.notes).toEqual({ before: null, after: 'Updated note' })
    expect(parseCorrectionPayload({
      changes: { author_id: { before: 3, after: null } }, evidence,
    }, 'attribution').changes.author_id).toEqual({ before: 3, after: null })
    expect(() => parseCorrectionPayload({
      changes: { author_id: { before: 3, after: '4' } }, evidence,
    }, 'attribution')).toThrow('positive integer or null')
  })

  it('rejects values outside constrained field domains', () => {
    expect(() => parseCorrectionPayload({
      changes: { language: { before: 'en', after: 'xx' } }, evidence,
    }, 'quote')).toThrow('Invalid quote language')
    expect(() => parseCorrectionPayload({
      changes: { source_medium: { before: 'book', after: 'text' } }, evidence,
    }, 'source')).toThrow('Invalid source medium')
    expect(() => parseCorrectionPayload({
      changes: { locator_type: { before: null, after: 'paragraph' } }, evidence,
    }, 'source')).toThrow('Invalid locator type')
  })

  it('allows a nullable existing quote language to be corrected', () => {
    expect(parseCorrectionPayload({
      changes: { language: { before: null, after: 'fr' } }, evidence,
    }, 'quote').changes.language).toEqual({ before: null, after: 'fr' })
    expect(() => parseCorrectionPayload({
      changes: { language: { before: null, after: 'xx' } }, evidence,
    }, 'quote')).toThrow('Invalid quote language')
  })

  it('includes nested SQLite causes when classifying database guard failures', () => {
    const error = new Error('Failed query', { cause: new Error('Quote correction version chain is no longer current') })
    expect(nestedErrorMessage(error)).toContain('version chain is no longer current')
  })
})
