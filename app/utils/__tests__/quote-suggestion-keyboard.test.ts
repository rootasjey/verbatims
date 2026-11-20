import { describe, expect, it, vi } from 'vitest'
import { shouldHandleSuggestionPanelKeydown } from '../quote-suggestion-keyboard'

describe('quote suggestion keyboard activation', () => {
  it('leaves Enter and Space activation on the focused suggestion button to the browser', () => {
    const button = {}
    const target = { closest: vi.fn(() => button) }

    expect(shouldHandleSuggestionPanelKeydown({ key: 'Enter', target: target as unknown as EventTarget })).toBe(false)
    expect(shouldHandleSuggestionPanelKeydown({ key: ' ', target: target as unknown as EventTarget })).toBe(false)
    expect(target.closest).toHaveBeenCalledWith('button')
  })

  it('continues to handle navigation keys and Enter from the input', () => {
    const inputTarget = { closest: vi.fn(() => null) }

    expect(shouldHandleSuggestionPanelKeydown({ key: 'ArrowDown', target: inputTarget as unknown as EventTarget })).toBe(true)
    expect(shouldHandleSuggestionPanelKeydown({ key: 'Enter', target: inputTarget as unknown as EventTarget })).toBe(true)
  })
})
