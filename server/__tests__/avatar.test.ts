import { describe, expect, it } from 'vitest'
import { isTroncheAvatarUrl } from '../utils/avatar'

describe('isTroncheAvatarUrl', () => {
  it('accepts a URL served by Tronche', () => {
    expect(isTroncheAvatarUrl('https://tronche.cc/api/avatar/verbatims-beam-01?variant=beam&size=128')).toBe(true)
  })

  it('rejects other hosts and paths', () => {
    expect(isTroncheAvatarUrl('https://example.com/api/avatar/verbatims-beam-01?variant=beam')).toBe(false)
    expect(isTroncheAvatarUrl('https://tronche.cc/about')).toBe(false)
    expect(isTroncheAvatarUrl('http://tronche.cc/api/avatar/verbatims-beam-01?variant=beam')).toBe(false)
  })

  it('rejects values that are not bounded strings', () => {
    expect(isTroncheAvatarUrl(null)).toBe(false)
    expect(isTroncheAvatarUrl(`https://tronche.cc/api/avatar/${'a'.repeat(2048)}`)).toBe(false)
  })
})
