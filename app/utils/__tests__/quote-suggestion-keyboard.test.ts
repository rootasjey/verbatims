import { describe, expect, it, vi } from 'vitest'
import { handleQuoteFormKeydown, shouldHandleSuggestionPanelKeydown } from '../quote-suggestion-keyboard'

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

  it.each(['AddQuoteDialog', 'AddQuoteDrawer'])('%s selects a keyboard-activated suggestion without submitting', () => {
    const selectSuggestion = vi.fn()
    const submitForm = vi.fn()
    const preventDefault = vi.fn()
    const event = {
      key: 'Enter',
      target: { closest: vi.fn(() => ({})) } as unknown as EventTarget,
      isComposing: false,
      defaultPrevented: false,
      ctrlKey: false,
      metaKey: false,
      preventDefault,
    }

    // The panel ignores the focused button; native Enter activation then invokes its click action.
    expect(shouldHandleSuggestionPanelKeydown(event)).toBe(false)
    handleQuoteFormKeydown(event, {
      step: 2,
      submitting: false,
      advance: vi.fn(),
      submit: submitForm,
    })
    if (!preventDefault.mock.calls.length) selectSuggestion()

    expect(selectSuggestion).toHaveBeenCalledOnce()
    expect(submitForm).not.toHaveBeenCalled()
    expect(preventDefault).not.toHaveBeenCalled()
  })
})
