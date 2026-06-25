import { describe, it, expect } from 'vitest'
import { parseTags } from '../tags'

describe('parseTags', () => {
  it('returns empty array for null tagNames', () => {
    expect(parseTags(null, '')).toEqual([])
  })

  it('returns empty array for undefined tagNames', () => {
    expect(parseTags(undefined, undefined)).toEqual([])
  })

  it('returns empty array for empty string', () => {
    expect(parseTags('', '')).toEqual([])
  })

  it('parses a single tag', () => {
    const result = parseTags('wisdom', '#3B82F6')
    expect(result).toEqual([{ name: 'wisdom', color: '#3B82F6' }])
  })

  it('parses multiple tags with colors', () => {
    const result = parseTags('wisdom,philosophy', '#3B82F6,#10B981')
    expect(result).toEqual([
      { name: 'wisdom', color: '#3B82F6' },
      { name: 'philosophy', color: '#10B981' },
    ])
  })

  it('trims whitespace from tag names', () => {
    const result = parseTags(' wisdom , philosophy ')
    expect(result).toEqual([
      { name: 'wisdom', color: 'gray' },
      { name: 'philosophy', color: 'gray' },
    ])
  })

  it('defaults to gray when color count mismatches', () => {
    const result = parseTags('wisdom,philosophy,stoicism', '#3B82F6')
    expect(result).toEqual([
      { name: 'wisdom', color: '#3B82F6' },
      { name: 'philosophy', color: 'gray' },
      { name: 'stoicism', color: 'gray' },
    ])
  })

  it('defaults to gray when tagColors is null', () => {
    const result = parseTags('wisdom,philosophy', null)
    expect(result).toEqual([
      { name: 'wisdom', color: 'gray' },
      { name: 'philosophy', color: 'gray' },
    ])
  })
})
