import { describe, expect, it } from 'vitest'
import { createEmailChangeToken, EMAIL_CHANGE_TOKEN_EXPIRY_MS, hashEmailChangeToken } from '../email-change'

describe('email change tokens', () => {
  it('generates a cryptographically random 256-bit hex token', () => {
    const token = createEmailChangeToken()

    expect(token).toMatch(/^[0-9a-f]{64}$/)
    expect(createEmailChangeToken()).not.toBe(token)
  })

  it('hashes a token consistently without returning the raw token', async () => {
    const token = createEmailChangeToken()
    const hash = await hashEmailChangeToken(token)

    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).not.toBe(token)
    expect(await hashEmailChangeToken(token)).toBe(hash)
  })

  it('expires confirmation links after one hour', () => {
    expect(EMAIL_CHANGE_TOKEN_EXPIRY_MS).toBe(60 * 60 * 1000)
  })
})
