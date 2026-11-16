import { describe, expect, it } from 'vitest'
import { collectQuoteSubmissionStrings, serializeQuoteCreationError } from '../quote-error-logging'

describe('quote creation error logging', () => {
  it('collects submitted strings so error details can redact form values', () => {
    const values = collectQuoteSubmissionStrings({
      name: 'A submitted quote',
      attributions: [{ new_author: { name: 'Verity Crawford' } }],
      sources: [{ title: 'Verity', timecode: '00:27:14' }],
    })

    expect(values).toEqual(expect.arrayContaining([
      'A submitted quote',
      'Verity Crawford',
      'Verity',
      '00:27:14',
    ]))
  })

  it('serializes error causes and codes while redacting submitted values', () => {
    const cause = Object.assign(new Error('constraint failed for Verity'), { code: 'SQLITE_CONSTRAINT' })
    const error = Object.assign(new Error('Failed query for A submitted quote', { cause }), { code: 'SQLITE_ERROR' })

    const serialized = serializeQuoteCreationError(error, ['A submitted quote', 'Verity'])
    const json = JSON.stringify(serialized)

    expect(serialized).toMatchObject({
      name: 'Error',
      message: 'Failed query for [redacted]',
      code: 'SQLITE_ERROR',
      cause: {
        message: 'constraint failed for [redacted]',
        code: 'SQLITE_CONSTRAINT',
      },
    })
    expect(json).not.toContain('A submitted quote')
    expect(json).not.toContain('Verity')
  })
})
